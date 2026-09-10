import express, { type NextFunction, type Request, type Response } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { InstanceService } from '../../application/instances/InstanceService'
import type { CreateInstanceInput } from '../../application/instances/InstanceRepository'
import type { AuthService } from '../../application/auth/AuthService'
import type { SessionCookieConfig } from '../../application/auth/SessionService'
import type { PairingService } from '../../application/instances/PairingService'
import type { LiveMessageFeed } from '../../application/messages/LiveMessageFeed'
import type { ScannerConfig, ScannerService } from '../../application/scanner/ScannerService'
import type { AuditService } from '../../application/audit/AuditService'
import type { DrizzleAuditLogStore } from '../../infrastructure/database/repositories/DrizzleAuditLogStore'
import type { DrizzleMessageStore } from '../../infrastructure/database/repositories/DrizzleMessageStore'
import type { DrizzleTaskStore } from '../../infrastructure/database/repositories/DrizzleTaskStore'
import type { DrizzleJobStore, JobRecord } from '../../infrastructure/database/repositories/DrizzleJobStore'
import { createPairingRoutes } from './PairingRoutes'
import { clearSessionCookie, readSessionCookie, setSessionCookie } from '../../application/auth/SessionCookie'
import { createAuthMiddleware, csrfProtection, getPrincipal, issueCsrfCookie, requirePermission } from './AuthMiddleware'

const createSchema = z.object({ slug: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,98}[a-z0-9]$/).max(100), name: z.string().trim().min(1).max(160), config: z.record(z.unknown()).optional() })
const updateSchema = z.object({ name: z.string().trim().min(1).max(160).optional(), config: z.record(z.unknown()).optional() }).refine((v) => v.name !== undefined || v.config !== undefined)
const idSchema = z.string().uuid()
const loginSchema = z.object({ username: z.string().trim().min(1).max(120), password: z.string().min(1).max(1024) })
const scannerSchema = z.object({ enabled: z.boolean(), keywords: z.array(z.string().trim().min(1).max(160)).max(100), caseSensitive: z.boolean().optional() })
const jobCreateSchema = z.object({ name: z.string().trim().min(1).max(160), type: z.literal('send-message'), schedule: z.string().trim().min(1).max(160), timezone: z.string().trim().max(80).optional(), enabled: z.boolean().optional(), payload: z.object({ chatId: z.string().min(1), text: z.string().min(1).max(4096) }) })
const jobPatchSchema = z.object({ enabled: z.boolean() })

class LoginRateLimiter {
  private readonly hits = new Map<string, number[]>()
  constructor(private readonly max = 5, private readonly windowMs = 60_000) {}
  allow(key: string): boolean {
    const now = Date.now()
    const recent = (this.hits.get(key) ?? []).filter((at) => now - at < this.windowMs)
    if (recent.length >= this.max) { this.hits.set(key, recent); return false }
    recent.push(now); this.hits.set(key, recent)
    if (this.hits.size > 10_000) this.prune(now)
    return true
  }
  private prune(now: number) { for (const [key, values] of this.hits) if (!values.some((at) => now - at < this.windowMs)) this.hits.delete(key) }
}

export interface ApiDebugHooks {
  mockIncoming(instanceId: string, message: { chatId: string; text?: string; senderId?: string; chatType?: 'private' | 'group' }): Promise<void>
}

export type ReadinessChecks = () => Promise<Record<string, { ok: boolean; detail?: string }>>

export interface ApiServerOptions {
  instances: InstanceService
  auth: AuthService
  sessionCookie: SessionCookieConfig
  csrfSecret: string
  pairing: PairingService
  liveFeed: LiveMessageFeed
  scanner: ScannerService
  messages: DrizzleMessageStore
  audit: AuditService
  auditStore: DrizzleAuditLogStore
  taskStore: DrizzleTaskStore
  jobs: DrizzleJobStore
  debug?: ApiDebugHooks
  /** Optional deep checks for /health/ready (DB pool, downstream services). */
  readiness?: ReadinessChecks
}

export function createApiServer(options: ApiServerOptions) {
  const app = express()
  const loginLimiter = new LoginRateLimiter()
  const authenticate = createAuthMiddleware({ auth: options.auth, cookie: options.sessionCookie })
  app.disable('x-powered-by')
  app.use(express.json({ limit: '256kb' }))
  app.use((req, res, next) => {
    const requestId = typeof req.headers['x-request-id'] === 'string' && /^[A-Za-z0-9._:-]{1,120}$/.test(req.headers['x-request-id']) ? req.headers['x-request-id'] : randomUUID()
    res.setHeader('x-request-id', requestId); res.locals.requestId = requestId; next()
  })
  app.get('/health/live', (_req, res) => res.json({ status: 'ok' }))
  app.get('/health/ready', (_req, res) => {
    if (!options.readiness) { res.json({ status: 'ok', checks: {} }); return }
    const timeout = new Promise<never>((_, reject) => { setTimeout(() => reject(new Error('readiness timeout')), 3_000).unref() })
    void Promise.race([options.readiness(), timeout])
      .then((checks) => {
        const failed = Object.entries(checks).filter(([, result]) => !result.ok)
        const body = {
          status: failed.length ? 'unavailable' : 'ok',
          checks: Object.fromEntries(Object.entries(checks).map(([name, result]) => [name, result.ok ? 'ok' : (result.detail ?? 'unavailable')])),
        }
        res.status(failed.length ? 503 : 200).json(body)
      })
      .catch((error: unknown) => {
        res.status(503).json({ status: 'unavailable', checks: { probe: error instanceof Error ? error.message : 'unavailable' } })
      })
  })
  app.get('/health/version', (_req, res) => res.json({ version: process.env.npm_package_version ?? 'unknown' }))

  const auditOf = (req: Request, res: Response) => ({
    record(entry: { action: string; target?: string | null; result: 'SUCCESS' | 'FAILURE' | 'DENIED'; instanceId?: string | null; actorId?: string | null; metadata?: Record<string, unknown> }) {
      const principal = getPrincipal(res)
      options.audit.record({
        actorType: principal ? 'user' : 'system',
        actorId: principal?.userId ?? entry.actorId ?? null,
        instanceId: entry.instanceId ?? null,
        action: entry.action,
        target: entry.target ?? null,
        result: entry.result,
        requestId: (res.locals.requestId as string | undefined) ?? null,
        ip: req.ip ?? null,
        metadata: entry.metadata,
      })
    },
  })

  app.post('/api/v1/auth/login', async (req, res, next) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown'
      if (!loginLimiter.allow(ip)) return error(res, 429, 'RATE_LIMITED', 'Too many login attempts', res.locals.requestId)
      const input = loginSchema.parse(req.body)
      try {
        const result = await options.auth.login(input.username, input.password, ip, req.get('user-agent')?.slice(0, 1024))
        setSessionCookie(res, result.token, options.sessionCookie)
        issueCsrfCookie(res, options.csrfSecret, result.principal.sessionId, options.sessionCookie.secure)
        options.audit.record({ actorType: 'user', actorId: result.principal.userId, action: 'auth.login', target: input.username, result: 'SUCCESS', ip, metadata: { sessionId: result.principal.sessionId } })
        return res.json({ user: { id: result.principal.userId, username: result.principal.username, roles: [...result.principal.roles], permissions: [...result.principal.permissions] } })
      } catch (inner) {
        options.audit.record({ actorType: 'user', action: 'auth.login', target: input.username, result: 'FAILURE', ip, metadata: { reason: inner instanceof Error ? inner.message : String(inner) } })
        throw inner
      }
    } catch (e) {
      if (e instanceof z.ZodError) return error(res, 400, 'VALIDATION_ERROR', 'Invalid login payload', res.locals.requestId)
      if (e instanceof Error && e.message === 'Invalid credentials') return error(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials', res.locals.requestId)
      return next(e)
    }
  })
  app.post('/api/v1/auth/logout', authenticate, csrfProtection(options.csrfSecret), async (req, res, next) => {
    try {
      await options.auth.logout(readSessionCookie(req, options.sessionCookie))
      clearSessionCookie(res, options.sessionCookie)
      auditOf(req, res).record({ action: 'auth.logout', result: 'SUCCESS' })
      res.status(204).send()
    } catch (e) { next(e) }
  })
  app.get('/api/v1/auth/me', authenticate, (_req, res) => {
    const principal = getPrincipal(res)!
    res.json({ user: { id: principal.userId, username: principal.username, roles: [...principal.roles], permissions: [...principal.permissions] } })
  })
  app.use('/api/v1', authenticate, csrfProtection(options.csrfSecret))

  app.use('/api/v1', requirePermission('instances:read'), createPairingRoutes(options.pairing, options.liveFeed, requirePermission('instances:start')))

  app.get('/api/v1/instances', requirePermission('instances:read'), async (req, res, next) => {
    try {
      const rawLimit = req.query.limit ? Number(req.query.limit) : undefined
      if (rawLimit !== undefined && (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100)) return error(res, 400, 'VALIDATION_ERROR', 'limit must be an integer between 1 and 100', res.locals.requestId)
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined
      res.json(await options.instances.list({ limit: rawLimit, cursor }))
    } catch (e) { next(e) }
  })
  app.post('/api/v1/instances', requirePermission('instances:create'), async (req, res, next) => {
    try {
      const input = createSchema.parse(req.body) as CreateInstanceInput
      const instance = await options.instances.create(input)
      auditOf(req, res).record({ action: 'instance.create', target: instance.slug, result: 'SUCCESS', instanceId: instance.id })
      res.status(201).json(instance)
    } catch (e) { next(e) }
  })
  app.get('/api/v1/instances/:id', requirePermission('instances:read'), async (req, res, next) => { try { res.json(await options.instances.get(idSchema.parse(req.params.id))) } catch (e) { next(e) } })
  app.patch('/api/v1/instances/:id', requirePermission('instances:update'), async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id)
      const instance = await options.instances.update(id, updateSchema.parse(req.body))
      auditOf(req, res).record({ action: 'instance.update', target: instance.slug, result: 'SUCCESS', instanceId: id })
      res.json(instance)
    } catch (e) { next(e) }
  })
  app.delete('/api/v1/instances/:id', requirePermission('instances:delete'), async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id)
      await options.instances.delete(id)
      auditOf(req, res).record({ action: 'instance.delete', target: id, result: 'SUCCESS', instanceId: id })
      res.status(204).send()
    } catch (e) { next(e) }
  })

  app.get('/api/v1/instances/:id/messages', requirePermission('instances:read'), async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id)
      const limit = Number(req.query.limit ?? 100)
      if (!Number.isInteger(limit) || limit < 1 || limit > 500) return error(res, 400, 'VALIDATION_ERROR', 'limit must be an integer between 1 and 500', res.locals.requestId)
      const before = typeof req.query.before === 'string' && /^[0-9a-f-]{36}$/i.test(req.query.before) ? req.query.before : undefined
      res.json({ items: await options.messages.list(id, { limit, before }) })
    } catch (e) { next(e) }
  })

  app.get('/api/v1/instances/:id/scanner', requirePermission('scanner:read'), async (req, res, next) => {
    try { res.json(await options.scanner.getConfig(idSchema.parse(req.params.id))) } catch (e) { next(e) }
  })
  app.put('/api/v1/instances/:id/scanner', requirePermission('scanner:manage'), async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id)
      const config = await options.scanner.setConfig(id, scannerSchema.parse(req.body) as ScannerConfig)
      auditOf(req, res).record({ action: 'scanner.config.update', target: id, result: 'SUCCESS', instanceId: id, metadata: { enabled: config.enabled, keywordCount: config.keywords.length } })
      res.json(config)
    } catch (e) { next(e) }
  })
  app.get('/api/v1/instances/:id/scanner/matches', requirePermission('scanner:read'), async (req, res, next) => {
    try { const limit = Number(req.query.limit ?? 100); if (!Number.isInteger(limit) || limit < 1 || limit > 500) return error(res, 400, 'VALIDATION_ERROR', 'limit must be an integer between 1 and 500', res.locals.requestId); res.json({ items: await options.scanner.listMatches(idSchema.parse(req.params.id), limit) }) } catch (e) { next(e) }
  })

  const lifecycle = (action: string, fn: (id: string) => Promise<unknown>): express.RequestHandler => async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id)
      const record = await fn(id)
      auditOf(req, res).record({ action: `instance.${action}`, target: id, result: 'SUCCESS', instanceId: id })
      res.status(202).json(record)
    } catch (e) { next(e) }
  }
  app.post('/api/v1/instances/:id/start', requirePermission('instances:start'), lifecycle('start', options.instances.start.bind(options.instances)))
  app.post('/api/v1/instances/:id/stop', requirePermission('instances:stop'), lifecycle('stop', options.instances.stop.bind(options.instances)))
  app.post('/api/v1/instances/:id/restart', requirePermission('instances:restart'), lifecycle('restart', options.instances.restart.bind(options.instances)))
  app.post('/api/v1/instances/:id/reconnect', requirePermission('instances:reconnect'), lifecycle('reconnect', options.instances.reconnect.bind(options.instances)))

  app.get('/api/v1/instances/:id/tasks', requirePermission('tasks:read'), async (req, res, next) => {
    try {
      const limit = Number(req.query.limit ?? 50)
      if (!Number.isInteger(limit) || limit < 1 || limit > 200) return error(res, 400, 'VALIDATION_ERROR', 'limit must be an integer between 1 and 200', res.locals.requestId)
      res.json({ items: await options.taskStore.list(idSchema.parse(req.params.id), limit) })
    } catch (e) { next(e) }
  })

  const serializeJob = (job: JobRecord) => ({ ...job, scheduleSeconds: parseScheduleSeconds(job.schedule) })
  app.get('/api/v1/instances/:id/jobs', requirePermission('jobs:read'), async (req, res, next) => {
    try { res.json({ items: (await options.jobs.list(idSchema.parse(req.params.id))).map(serializeJob) }) } catch (e) { next(e) }
  })
  app.post('/api/v1/instances/:id/jobs', requirePermission('jobs:manage'), async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id)
      const input = jobCreateSchema.parse(req.body)
      const job = await options.jobs.create({ instanceId: id, name: input.name, type: input.type, schedule: input.schedule, timezone: input.timezone, enabled: input.enabled, payload: { chatId: input.payload.chatId, text: input.payload.text } })
      auditOf(req, res).record({ action: 'job.create', target: job.name, result: 'SUCCESS', instanceId: id, metadata: { jobId: job.id, type: job.type, schedule: job.schedule } })
      res.status(201).json(serializeJob(job))
    } catch (e) { next(e) }
  })
  app.patch('/api/v1/jobs/:id', requirePermission('jobs:manage'), async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id)
      const input = jobPatchSchema.parse(req.body)
      const job = await options.jobs.setEnabled(id, input.enabled)
      if (!job) return error(res, 404, 'NOT_FOUND', 'Job not found', res.locals.requestId)
      auditOf(req, res).record({ action: 'job.update', target: job.name, result: 'SUCCESS', instanceId: job.instanceId, metadata: { jobId: job.id, enabled: job.enabled } })
      res.json(serializeJob(job))
    } catch (e) { next(e) }
  })
  app.delete('/api/v1/jobs/:id', requirePermission('jobs:manage'), async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id)
      const job = await options.jobs.findById(id)
      if (!job) return error(res, 404, 'NOT_FOUND', 'Job not found', res.locals.requestId)
      await options.jobs.remove(id)
      auditOf(req, res).record({ action: 'job.delete', target: job.name, result: 'SUCCESS', instanceId: job.instanceId, metadata: { jobId: job.id } })
      res.status(204).send()
    } catch (e) { next(e) }
  })

  app.get('/api/v1/audit', requirePermission('audit:read'), async (req, res, next) => {
    try {
      const limit = Number(req.query.limit ?? 100)
      if (!Number.isInteger(limit) || limit < 1 || limit > 500) return error(res, 400, 'VALIDATION_ERROR', 'limit must be an integer between 1 and 500', res.locals.requestId)
      const instanceId = typeof req.query.instanceId === 'string' && /^[0-9a-f-]{36}$/i.test(req.query.instanceId) ? req.query.instanceId : undefined
      const actorId = typeof req.query.actorId === 'string' && /^[0-9a-f-]{36}$/i.test(req.query.actorId) ? req.query.actorId : undefined
      res.json({ items: await options.auditStore.list({ instanceId, actorId, limit }) })
    } catch (e) { next(e) }
  })

  if (options.debug) {
    app.post('/api/v1/instances/:id/mock/incoming', requirePermission('instances:update'), async (req, res, next) => {
      try {
        const id = idSchema.parse(req.params.id)
        const body = z.object({ chatId: z.string().min(1).max(255), text: z.string().min(1).max(4096).optional(), senderId: z.string().min(1).max(180).optional(), chatType: z.enum(['private', 'group']).optional() }).parse(req.body) as { chatId: string; text?: string; senderId?: string; chatType?: 'private' | 'group' }
        await options.debug!.mockIncoming(id, body)
        res.status(202).json({ accepted: true })
      } catch (e) { next(e) }
    })
  }

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return
    if (err instanceof z.ZodError) return error(res, 400, 'VALIDATION_ERROR', err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), res.locals.requestId)
    if (err instanceof Error && /already exists/i.test(err.message)) return error(res, 409, 'CONFLICT', err.message, res.locals.requestId)
    if (err instanceof Error && /not found/i.test(err.message)) return error(res, 404, 'NOT_FOUND', err.message, res.locals.requestId)
    console.error({ requestId: res.locals.requestId, path: req.path, error: err instanceof Error ? err.message : String(err) })
    return error(res, 500, 'INTERNAL_ERROR', 'Internal server error', res.locals.requestId)
  })
  return app
}

function parseScheduleSeconds(schedule: string): number | null {
  try { return Math.round(Number(schedule.replace(/^interval:/i, ''))) } catch { return null }
}

function error(res: Response, status: number, code: string, message: string, requestId?: string) { return res.status(status).json({ error: { code, message, requestId: requestId ?? res.locals.requestId } }) }
