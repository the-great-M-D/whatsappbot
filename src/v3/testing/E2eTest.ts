/**
 * End-to-end integration test for the V3 vertical slice:
 *
 *   Dashboard client (HTTP + WebSocket)
 *     -> REST API -> InstanceManager -> worker process
 *     -> MockProvider -> events -> worker WS -> EventBus
 *     -> MessageRecorder / ScannerService / AuditService / TaskManager / JobScheduler
 *     -> PostgreSQL (messages, scanner_events, audit_logs, tasks, jobs)
 *
 * Run against a migrated PostgreSQL database:
 *   npm run build && npm run v3:e2e
 */
import { WebSocket } from 'ws'
import { randomUUID } from 'node:crypto'
import type { Server } from 'node:http'
import { eq, like } from 'drizzle-orm'
import { createDatabase } from '../infrastructure/database/client'
import { seedDefaultRbac } from '../infrastructure/database/SeedDefaults'
import { Argon2idPasswordHasher } from '../infrastructure/auth/Argon2idPasswordHasher'
import { botInstances, roles, userRoles, users } from '../infrastructure/database/schema'
import { createV3Application, type V3Application } from '../app/bootstrap/V3Application'
import { WebSocketGateway } from '../interfaces/websocket/WebSocketGateway'

const ADMIN_USERNAME = 'e2e-admin'
const ADMIN_PASSWORD = 'e2e-admin-password-123'
const INSTANCE_SLUG = `e2e-test-${Date.now()}`
const COOKIE_NAME = 'v3_session'
const CSRF_COOKIE = 'v3_csrf'

interface Envelope { id?: string; type?: string; instanceId?: string; timestamp?: string; payload?: Record<string, unknown> & { type?: string } }

let failures = 0

function assert(condition: unknown, label: string): void {
  if (condition) {
    console.log(`  ok - ${label}`)
  } else {
    failures++
    console.error(`  FAIL - ${label}`)
  }
}

async function waitFor(label: string, check: () => Promise<boolean> | boolean, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await check()) return true
    await delay(250)
  }
  console.error(`  FAIL - timed out waiting for ${label} (${timeoutMs}ms)`)
  failures++
  return false
}

function delay(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)) }

class TestHttpClient {
  private cookies = new Map<string, string>()

  constructor(private readonly baseUrl: string) {}

  cookie(name: string): string | undefined { return this.cookies.get(name) }

  async request<T>(path: string, init: RequestInit & { raw?: boolean } = {}): Promise<{ status: number; body: T | string; headers: Headers }> {
    const headers = new Headers(init.headers)
    if (this.cookies.size) headers.set('cookie', [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; '))
    const method = (init.method ?? 'GET').toUpperCase()
    if (method !== 'GET' && this.cookie(CSRF_COOKIE)) headers.set('x-csrf-token', this.cookie(CSRF_COOKIE)!)
    const response = await fetch(`${this.baseUrl}${path}`, { ...init, method, headers })
    for (const raw of response.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(';')
      const index = pair.indexOf('=')
      if (index > 0) this.cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1))
    }
    const text = await response.text()
    let body: T | string = text
    if (text) { try { body = JSON.parse(text) as T } catch { /* keep text */ } }
    return { status: response.status, body, headers: response.headers }
  }

  async get<T>(path: string) { return this.request<T>(path) }
  async post<T>(path: string, body?: unknown) { return this.request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }) }
  async put<T>(path: string, body: unknown) { return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) }) }
}

class TestRealtimeClient {
  private socket?: WebSocket
  readonly events: Envelope[] = []

  constructor(private readonly url: string, private readonly sessionCookie: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.url, { headers: { cookie: `${COOKIE_NAME}=${this.sessionCookie}` } })
      this.socket.once('open', () => resolve())
      this.socket.once('error', reject)
      this.socket.on('message', (raw) => {
        try { this.events.push(JSON.parse(raw.toString()) as Envelope) } catch { /* ignore */ }
      })
    })
  }

  send(message: Record<string, unknown>): void {
    this.socket?.send(JSON.stringify(message))
  }

  eventsOf(type: string): Envelope[] {
    return this.events.filter((event) => event.payload?.type === type || (event.type === type))
  }

  close(): void { this.socket?.close() }
}

async function seedAdminUser(): Promise<void> {
  const database = createDatabase(process.env.DATABASE_URL!, 2)
  const { db } = database
  await seedDefaultRbac(db)
  // Clean up from any previous local runs before re-seeding.
  await db.delete(botInstances).where(like(botInstances.slug, 'e2e-test-%'))
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, ADMIN_USERNAME)).limit(1)
  if (existing) await db.delete(users).where(eq(users.id, existing.id))

  const hasher = new Argon2idPasswordHasher()
  const passwordHash = await hasher.hash(ADMIN_PASSWORD)
  const [admin] = await db.insert(users).values({ username: ADMIN_USERNAME, passwordHash, status: 'ACTIVE' }).returning({ id: users.id })
  const [ownerRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'OWNER')).limit(1)
  if (admin && ownerRole) await db.insert(userRoles).values({ userId: admin.id, roleId: ownerRole.id }).onConflictDoNothing()
  await database.close()
}

function listen(server: Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      resolve(typeof address === 'object' && address ? address.port : 0)
    })
  })
}

async function main(): Promise<void> {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test'
  process.env.SESSION_SECURE = process.env.SESSION_SECURE ?? 'false'
  process.env.CSRF_SECRET = process.env.CSRF_SECRET ?? 'e2e-csrf-secret-0123456789abcdef0123456789'
  process.env.SCHEDULER_INTERVAL_MS = process.env.SCHEDULER_INTERVAL_MS ?? '2000'
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')

  console.log('seeding RBAC + admin user')
  await seedAdminUser()

  console.log('booting V3 application')
  const application: V3Application = createV3Application()
  const server: Server = application.app.listen(0)
  const port = await listen(server)
  const baseUrl = `http://127.0.0.1:${port}`

  const websocket = new WebSocketGateway(server, application.instanceRepository, async (request) => {
    const cookie = (request.headers.cookie ?? '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))
    if (!cookie) return null
    const principal = await application.auth.resolve(decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)))
    if (!principal) return null
    return { userId: principal.userId, permissions: principal.permissions }
  })
  websocket.attachWorkerEvents(application.workers)
  websocket.attachEventBus(application.events)
  application.scheduler.start()

  const http = new TestHttpClient(baseUrl)
  try {
    console.log('1. authentication + RBAC')
    const login = await http.post<{ user?: { username: string; permissions: string[] } }>('/api/v1/auth/login', { username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
    assert(login.status === 200, `login returns 200 (got ${login.status})`)
    const loginBody = login.body as { user?: { permissions?: string[] } }
    assert(loginBody?.user?.permissions?.includes('*'), 'OWNER principal carries the * wildcard')
    assert(http.cookie(CSRF_COOKIE) !== undefined, 'CSRF cookie issued at login')

    const me = await http.get<{ user?: { username: string } }>('/api/v1/auth/me')
    assert(me.status === 200, 'authenticated /auth/me')

    console.log('2. instance create + start (worker process)')
    const created = await http.post<{ id?: string; slug?: string; status?: string }>('/api/v1/instances', { slug: INSTANCE_SLUG, name: 'E2E Test Instance', config: { provider: 'mock' } })
    assert(created.status === 201, `instance created (got ${created.status})`)
    const instanceId = (created.body as { id: string }).id

    const realtime = new TestRealtimeClient(`ws://127.0.0.1:${port}/api/v1/ws`, http.cookie(COOKIE_NAME)!)
    await realtime.connect()
    realtime.send({ id: randomUUID(), type: 'command', action: 'subscribe', instanceId })

    const started = await http.post(`/api/v1/instances/${instanceId}/start`)
    assert(started.status === 202, `instance start accepted (got ${started.status})`)
    const connected = await waitFor('instance CONNECTED state', async () => {
      const state = await http.get<{ status?: string }>(`/api/v1/instances/${instanceId}`)
      return (state.body as { status?: string })?.status === 'CONNECTED'
    }, 20_000)
    assert(connected, 'instance reaches CONNECTED through the worker + mock provider')
    assert(await waitFor('connection event on the dashboard stream', () => realtime.eventsOf('connection').some((event) => (event.payload as { state?: string })?.state === 'CONNECTED'), 10_000),
      'dashboard WS receives the connection event')

    console.log('3. command execution (!ping -> reply -> CommandExecuted)')
    const ping = await http.post(`/api/v1/instances/${instanceId}/mock/incoming`, { chatId: 'e2e-group@g.us', text: '!ping' })
    assert(ping.status === 202, `mock incoming accepted (got ${ping.status})`)
    assert(await waitFor('CommandExecuted event', () => realtime.eventsOf('CommandExecuted').some((event) => (event.payload as { command?: string })?.command === 'ping'), 10_000),
      'CommandExecuted reaches the dashboard')
    assert(await waitFor('pong reply recorded', async () => {
      const history = await http.get<{ items?: Array<{ text?: string }> }>(`/api/v1/instances/${instanceId}/messages?limit=50`)
      return ((history.body as { items: Array<{ text?: string }> }).items ?? []).some((m) => m.text === 'pong')
    }, 10_000), 'provider sent the pong reply (recorded via message persistence)')

    console.log('4. scanner (config -> match -> persisted + event)')
    const scannerPut = await http.put(`/api/v1/instances/${instanceId}/scanner`, { enabled: true, keywords: ['urgent'], caseSensitive: false })
    assert(scannerPut.status === 200, `scanner config saved (got ${scannerPut.status})`)
    await http.post(`/api/v1/instances/${instanceId}/mock/incoming`, { chatId: 'e2e-group@g.us', text: 'URGENT: stock drop incoming' })
    assert(await waitFor('ScannerMatch event', () => realtime.eventsOf('ScannerMatch').length > 0, 10_000), 'scanner match published to dashboard')
    const matches = await http.get<{ items?: unknown[] }>(`/api/v1/instances/${instanceId}/scanner/matches`)
    assert((matches.body as { items?: unknown[] })?.items?.length !== undefined && ((matches.body as { items: unknown[] }).items?.length ?? 0) >= 1, 'scanner match persisted in scanner_events')

    console.log('5. message persistence')
    const messages = await http.get<{ items?: Array<{ text?: string }> }>(`/api/v1/instances/${instanceId}/messages?limit=50`)
    const messageItems = (messages.body as { items: Array<{ text?: string }> }).items ?? []
    assert(messageItems.length >= 3, `messages persisted (${messageItems.length} rows: ${messageItems.map((m) => m.text).join(' | ')})`)
    assert(messageItems.some((m) => m.text === 'pong'), 'outbound reply recorded in message history')

    console.log('6. scheduler (job -> task -> worker sendText)')
    const job = await http.post<{ id?: string; scheduleSeconds?: number }>(`/api/v1/instances/${instanceId}/jobs`, {
      name: 'e2e-scheduled-hello', type: 'send-message', schedule: '2',
      payload: { chatId: 'e2e-group@g.us', text: 'scheduled hello from jobs' },
    })
    assert(job.status === 201, `job created (got ${job.status})`)

    assert(await waitFor('JobExecuted event', () => realtime.eventsOf('JobExecuted').some((event) => (event.payload as { status?: string })?.status === 'SUCCEEDED'), 20_000),
      'scheduler executed the job successfully')
    assert(await waitFor('scheduled message persisted', async () => {
      const after = await http.get<{ items?: Array<{ text?: string }> }>(`/api/v1/instances/${instanceId}/messages?limit=50`)
      return ((after.body as { items: Array<{ text?: string }> }).items ?? []).some((m) => m.text === 'scheduled hello from jobs')
    }, 10_000), 'scheduled send-message job produced a persisted outbound message')

    const tasks = await http.get<{ items?: Array<{ type?: string; status?: string }> }>(`/api/v1/instances/${instanceId}/tasks`)
    const taskItems = (tasks.body as { items: Array<{ type?: string; status?: string }> }).items ?? []
    assert(taskItems.some((t) => t.type === 'job:send-message' && t.status === 'SUCCEEDED'), 'job run recorded as a SUCCEEDED task')
    assert(realtime.eventsOf('TaskUpdated').length > 0, 'TaskUpdated events streamed to dashboard')

    console.log('7. audit trail')
    const audit = await http.get<{ items?: Array<{ action?: string }> }>('/api/v1/audit?limit=100')
    const auditItems = (audit.body as { items: Array<{ action?: string }> }).items ?? []
    for (const expected of ['auth.login', 'instance.create', 'instance.start', 'scanner.config.update', 'job.create']) {
      assert(auditItems.some((entry) => entry.action === expected), `audit log contains ${expected}`)
    }

    console.log('8. shutdown path')
    const stopped = await http.post(`/api/v1/instances/${instanceId}/stop`)
    assert(stopped.status === 202, `instance stop accepted (got ${stopped.status})`)
    assert(await waitFor('instance STOPPED', async () => {
      const state = await http.get<{ status?: string }>(`/api/v1/instances/${instanceId}`)
      return (state.body as { status?: string })?.status === 'STOPPED'
    }, 15_000), 'instance stops cleanly')

    realtime.close()
  } finally {
    websocket.close().catch(() => undefined)
    server.close()
    await application.shutdown().catch(() => undefined)
  }

  if (failures > 0) {
    console.error(`\nE2E FAILED: ${failures} assertion(s) failed`)
    process.exitCode = 1
  } else {
    console.log('\nE2E PASSED: dashboard -> api -> worker -> provider -> events -> postgres all wired end-to-end')
  }
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
