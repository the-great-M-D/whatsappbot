import { WebSocket } from 'ws'
import { join, resolve } from 'node:path'
import type { InstanceState } from '../../domain/instances/InstanceLifecycle'
import type { WhatsAppProviderEvent } from '../../domain/whatsapp/WhatsAppProvider'
import { BaileysProvider } from '../whatsapp/baileys/BaileysProvider'

const instanceId = process.env.V3_WORKER_INSTANCE_ID
const token = process.env.V3_WORKER_TOKEN
const wsUrl = process.env.V3_WORKER_WS_URL

if (!instanceId || !token || !wsUrl) {
  process.stderr.write('V3 worker requires instance id, token and WebSocket URL\n')
  process.exit(78)
}

let socket: WebSocket | undefined
let provider: BaileysProvider | undefined
let stopping = false

function setState(state: InstanceState): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'state', instanceId, state }))
}

function emitProvider(event: WhatsAppProviderEvent): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'provider', instanceId, event }))
  if (event.type === 'connection') {
    const mapped: InstanceState = event.state === 'PAIRING'
      ? 'PAIRING'
      : event.state === 'CONNECTING'
        ? 'CONNECTING'
        : event.state === 'CONNECTED'
          ? 'CONNECTED'
          : 'DISCONNECTED'
    setState(mapped)
  }
}

async function shutdown(): Promise<void> {
  if (stopping) return
  stopping = true
  setState('STOPPING')
  await provider?.stop().catch(() => undefined)
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

async function main(): Promise<void> {
  socket = new WebSocket(wsUrl!)
  await new Promise<void>((resolvePromise, reject) => {
    socket!.once('open', () => {
      socket!.send(JSON.stringify({ type: 'hello', instanceId, token }))
      resolvePromise()
    })
    socket!.once('error', reject)
  })
  socket.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString()) as { type?: string; instanceId?: string }
      if (message.instanceId === instanceId && message.type === 'shutdown') void shutdown()
    } catch { /* ignore malformed manager messages */ }
  })

  const config = parseConfig()
  const configuredSessionDir = typeof config.sessionDir === 'string' ? config.sessionDir : undefined
  const sessionDir = configuredSessionDir
    ? resolve(configuredSessionDir)
    : join(process.cwd(), 'data', 'v3', 'sessions', instanceId)

  provider = new BaileysProvider({
    sessionDir,
    browserName: typeof config.browserName === 'string' ? config.browserName : 'Kaoi V3',
  })
  provider.onEvent(emitProvider)

  setState('STARTING')
  await provider.start()
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
  process.exitCode = 1
})
