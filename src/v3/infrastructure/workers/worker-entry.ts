import { WebSocket } from 'ws'
import { join, resolve } from 'node:path'
import type { InstanceState } from '../../domain/instances/InstanceLifecycle'
import type { WhatsAppProviderEvent } from '../../domain/whatsapp/WhatsAppProvider'
import { BaileysProvider } from '../whatsapp/baileys/BaileysProvider'
import { createDatabase } from '../database/client'
import { DrizzleSessionBackupStore } from '../database/repositories/DrizzleSessionBackupStore'
import { SessionBackupService } from '../whatsapp/SessionBackupService'

const instanceId = process.env.V3_WORKER_INSTANCE_ID, token = process.env.V3_WORKER_TOKEN, wsUrl = process.env.V3_WORKER_WS_URL
if (!instanceId || !token || !wsUrl) { process.stderr.write('V3 worker requires instance id, token and WebSocket URL\n'); process.exit(78) }
let socket: WebSocket | undefined, provider: BaileysProvider | undefined, stopping = false, backupTimer: NodeJS.Timeout | undefined, database: ReturnType<typeof createDatabase> | undefined
function setState(state: InstanceState): void { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'state', instanceId, state })) }
function emitProvider(event: WhatsAppProviderEvent): void { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'provider', instanceId, event })); if (event.type === 'connection') setState(event.state as InstanceState) }
async function shutdown(): Promise<void> { if (stopping) return; stopping = true; if (backupTimer) clearTimeout(backupTimer); setState('STOPPING'); await provider?.stop().catch(() => undefined); await database?.close().catch(() => undefined); setState('STOPPED'); socket?.close(1000, 'shutdown'); process.exitCode = 0 }
function parseConfig(): Record<string, unknown> { try { return JSON.parse(process.env.V3_WORKER_CONFIG ?? '{}') as Record<string, unknown> } catch { throw new Error('V3_WORKER_CONFIG is not valid JSON') } }
async function handleCommand(message: { id?: string; type?: string; action?: string; instanceId?: string; payload?: unknown }): Promise<void> { if (message.type !== 'command' || message.instanceId !== instanceId || !message.id) return; if (message.action !== 'pair') return; try { const payload = (message.payload ?? {}) as { method?: 'qr' | 'phone'; phoneNumber?: string }; if (payload.method !== 'qr' && payload.method !== 'phone') throw new Error('Invalid pairing method'); await provider?.pair(payload.method, payload.phoneNumber); socket?.send(JSON.stringify({ id: message.id, type: 'response', action: 'pair', instanceId, timestamp: new Date().toISOString() })) } catch (error) { socket?.send(JSON.stringify({ id: message.id, type: 'response', action: 'pair', instanceId, timestamp: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) })) } }
async function main(): Promise<void> {
  socket = new WebSocket(wsUrl!)
  await new Promise<void>((resolvePromise, reject) => { socket!.once('open', () => { socket!.send(JSON.stringify({ type: 'hello', instanceId, token })); resolvePromise() }); socket!.once('error', reject) })
  socket.on('message', (raw) => { try { const message = JSON.parse(raw.toString()) as { id?: string; type?: string; action?: string; instanceId?: string; payload?: unknown }; if (message.instanceId === instanceId && message.type === 'shutdown') void shutdown(); else void handleCommand(message) } catch { /* ignore malformed messages */ } })
  const config = parseConfig(); const configuredSessionDir = typeof config.sessionDir === 'string' ? config.sessionDir : undefined; const sessionDir = configuredSessionDir ? resolve(configuredSessionDir) : join(process.cwd(), 'data', 'v3', 'sessions', instanceId)
  const backupKey = process.env.SESSION_BACKUP_KEY
  if (backupKey && process.env.DATABASE_URL) {
    database = createDatabase(process.env.DATABASE_URL, 2); const backups = new SessionBackupService(new DrizzleSessionBackupStore(database.db), backupKey); await backups.restoreIfMissing(instanceId, sessionDir)
    const scheduleBackup = (): Promise<void> => new Promise((resolveBackup) => { if (backupTimer) clearTimeout(backupTimer); backupTimer = setTimeout(() => { backupTimer = undefined; void backups.backup(instanceId, sessionDir).catch(() => undefined).finally(resolveBackup) }, 1000) })
    provider = new BaileysProvider({ instanceId, sessionDir, browserName: typeof config.browserName === 'string' ? config.browserName : 'Kaoi V3', onCredentialsSaved: scheduleBackup })
  } else provider = new BaileysProvider({ instanceId, sessionDir, browserName: typeof config.browserName === 'string' ? config.browserName : 'Kaoi V3' })
  provider.onEvent(emitProvider); setState('STARTING'); await provider.start()
}
void main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`); process.exitCode = 1 })
