import { WebSocket } from 'ws'
import { join, resolve } from 'node:path'
import type { InstanceState } from '../../domain/instances/InstanceLifecycle'
import type { WhatsAppMessage, WhatsAppProvider, WhatsAppProviderEvent } from '../../domain/whatsapp/WhatsAppProvider'
import { BaileysProvider } from '../whatsapp/baileys/BaileysProvider'
import { MockProvider } from '../whatsapp/mock/MockProvider'
import { CommandRegistry, type CommandContext, type CommandResult } from '../../domain/commands/CommandRegistry'
import { createDatabase } from '../database/client'
import { DrizzleSessionBackupStore } from '../database/repositories/DrizzleSessionBackupStore'
import { SessionBackupService } from '../whatsapp/SessionBackupService'

const instanceId = process.env.V3_WORKER_INSTANCE_ID
const token = process.env.V3_WORKER_TOKEN
const wsUrl = process.env.V3_WORKER_WS_URL
if (!instanceId || !token || !wsUrl) {
  process.stderr.write('V3 worker requires instance id, token and WebSocket URL\n')
  process.exit(78)
}

const COMMAND_PREFIX = '!'
let socket: WebSocket | undefined
let provider: WhatsAppProvider | undefined
let stopping = false
let startedAt = 0
let backupTimer: NodeJS.Timeout | undefined
let database: ReturnType<typeof createDatabase> | undefined

const registry = new CommandRegistry()
registry.register({
  name: 'ping',
  aliases: ['p'],
  description: 'Reply with pong and the round-trip context',
  run: async () => ({ type: 'text', text: 'pong' }) as CommandResult,
})
registry.register({
  name: 'uptime',
  description: 'How long this worker has been running',
  run: async () => {
    const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
    return { type: 'text', text: `up ${seconds}s` } as CommandResult
  },
})
registry.register({
  name: 'help',
  description: 'List registered commands',
  run: async () => ({ type: 'text', text: `commands: ${registry.list().map((c) => c.name).join(', ')}` } as CommandResult),
})

function setState(state: InstanceState): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'state', instanceId, state }))
}

function emitProvider(event: WhatsAppProviderEvent): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'provider', instanceId, event }))
  if (event.type === 'connection') setState(event.state as InstanceState)
}

function emitDomain(name: string, payload: Record<string, unknown>): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'domain', instanceId, name, payload }))
}

async function shutdown(): Promise<void> {
  if (stopping) return
  stopping = true
  if (backupTimer) clearTimeout(backupTimer)
  setState('STOPPING')
  await provider?.stop().catch(() => undefined)
  await database?.close().catch(() => undefined)
  setState('STOPPED')
  socket?.close(1000, 'shutdown')
  process.exitCode = 0
}

function parseConfig(): Record<string, unknown> {
  try {
    return JSON.parse(process.env.V3_WORKER_CONFIG ?? '{}') as Record<string, unknown>
  } catch {
    throw new Error('V3_WORKER_CONFIG is not valid JSON')
  }
}

function enabledCommands(config: Record<string, unknown>): Set<string> | null {
  const list = config.commands
  if (!Array.isArray(list)) return null
  return new Set(list.filter((value): value is string => typeof value === 'string').map((value) => value.trim().toLowerCase()))
}

function commandAllowed(name: string, allowed: Set<string> | null): boolean {
  return allowed === null || allowed.has(name)
}

async function handleIncoming(message: WhatsAppMessage, allowed: Set<string> | null): Promise<void> {
  if (!message.text || message.isFromMe) return
  const text = message.text.trim()
  if (!text.startsWith(COMMAND_PREFIX)) return
  const [rawName, ...args] = text.substring(COMMAND_PREFIX.length).split(/\s+/)
  if (!rawName) return
  const command = registry.resolve(rawName)
  if (!command) return
  if (!commandAllowed(command.name, allowed)) return
  const context: CommandContext = { instanceId, actorId: message.senderId, chatId: message.chatId, chatType: message.chatType, args, text }
  const started = Date.now()
  try {
    const result = await command.run(context)
    const reply = result.type === 'text' ? result.text : undefined
    if (reply && provider) await provider.sendText(message.chatId, reply)
    emitDomain('CommandExecuted', { instanceId, command: command.name, success: result.type !== 'error', durationMs: Date.now() - started, chatId: message.chatId, replyWith: reply })
  } catch (error) {
    emitDomain('CommandExecuted', { instanceId, command: command.name, success: false, durationMs: Date.now() - started, chatId: message.chatId, error: error instanceof Error ? error.message : String(error) })
  }
}

interface WorkerCommandMessage {
  id?: string
  type?: string
  action?: string
  instanceId?: string
  payload?: unknown
}

async function handleCommand(message: WorkerCommandMessage): Promise<void> {
  if (message.type !== 'command' || message.instanceId !== instanceId || !message.id) return
  const payload = (message.payload ?? {}) as { method?: 'qr' | 'phone'; phoneNumber?: string; chatId?: string; text?: string; message?: Partial<WhatsAppMessage> & { chatId: string } }
  const respond = (error?: string) => {
    socket?.send(JSON.stringify({ id: message.id, type: 'response', action: message.action, instanceId, timestamp: new Date().toISOString(), ...(error ? { error } : {}) }))
  }
  try {
    switch (message.action) {
      case 'pair':
        if (payload.method !== 'qr' && payload.method !== 'phone') throw new Error('Invalid pairing method')
        await provider?.pair(payload.method, payload.phoneNumber)
        return respond()
      case 'send':
        if (typeof payload.chatId !== 'string' || !payload.chatId) throw new Error('chatId is required')
        if (typeof payload.text !== 'string' || !payload.text) throw new Error('text is required')
        await provider?.sendText(payload.chatId, payload.text)
        return respond()
      default:
        throw new Error(`Unknown worker command: ${String(message.action)}`)
    }
  } catch (error) {
    respond(error instanceof Error ? error.message : String(error))
  }
}

async function main(): Promise<void> {
  socket = new WebSocket(wsUrl)
  await new Promise<void>((resolvePromise, reject) => {
    socket.once('open', () => { socket!.send(JSON.stringify({ type: 'hello', instanceId, token })); resolvePromise() })
    socket.once('error', reject)
  })
  socket.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString()) as WorkerCommandMessage & { type?: string }
      if (message.instanceId === instanceId && message.type === 'shutdown') { void shutdown(); return }
      if (message.instanceId === instanceId && message.type === 'command' && message.action === 'mock-incoming') {
        const mock = provider as MockProvider | undefined
        const incoming = (message.payload ?? {}) as { chatId?: string; text?: string; senderId?: string; chatType?: 'private' | 'group' }
        if (mock instanceof MockProvider && incoming.chatId) mock.mockIncoming({ chatId: incoming.chatId, text: incoming.text, senderId: incoming.senderId, chatType: incoming.chatType })
        return
      }
      void handleCommand(message)
    } catch { /* ignore malformed messages */ }
  })

  const config = parseConfig()
  const allowed = enabledCommands(config)
  const configuredSessionDir = typeof config.sessionDir === 'string' ? config.sessionDir : undefined
  const sessionDir = configuredSessionDir ? resolve(configuredSessionDir) : join(process.cwd(), 'data', 'v3', 'sessions', instanceId)
  const browserName = typeof config.browserName === 'string' ? config.browserName : 'Kaoi V3'

  if (config.provider === 'mock') {
    provider = new MockProvider({ instanceId, onEvent: emitProvider })
  } else {
    const backupKey = process.env.SESSION_BACKUP_KEY
    if (backupKey && process.env.DATABASE_URL) {
      database = createDatabase(process.env.DATABASE_URL, 2)
      const backups = new SessionBackupService(new DrizzleSessionBackupStore(database.db), backupKey)
      await backups.restoreIfMissing(instanceId, sessionDir)
      const scheduleBackup = (): Promise<void> => new Promise((resolveBackup) => {
        if (backupTimer) clearTimeout(backupTimer)
        backupTimer = setTimeout(() => { backupTimer = undefined; void backups.backup(instanceId, sessionDir).catch(() => undefined).finally(resolveBackup) }, 1000)
      })
      provider = new BaileysProvider({ instanceId, sessionDir, browserName, onCredentialsSaved: scheduleBackup })
    } else {
      provider = new BaileysProvider({ instanceId, sessionDir, browserName })
    }
  }

  provider.onEvent((event) => {
    emitProvider(event)
    if (event.type === 'message') void handleIncoming(event.message, allowed).catch(() => undefined)
  })
  startedAt = Date.now()
  setState('STARTING')
  await provider.start()
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
  process.exitCode = 1
})
