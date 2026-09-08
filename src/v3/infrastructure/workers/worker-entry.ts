import { WebSocket } from 'ws'
import type { InstanceState } from '../../domain/instances/InstanceLifecycle'

const instanceId = process.env.V3_WORKER_INSTANCE_ID
const token = process.env.V3_WORKER_TOKEN
const wsUrl = process.env.V3_WORKER_WS_URL

if (!instanceId || !token || !wsUrl) {
  process.stderr.write('V3 worker requires instance id, token and WebSocket URL\n')
  process.exit(78)
}

let socket: WebSocket | undefined
let stopping = false

function setState(state: InstanceState): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'state', instanceId, state }))
}

async function shutdown(): Promise<void> {
  if (stopping) return
  stopping = true
  setState('STOPPING')
  socket?.close(1000, 'shutdown')
  setState('STOPPED')
  process.exitCode = 0
}

async function main(): Promise<void> {
  socket = new WebSocket(wsUrl!)
  await new Promise<void>((resolve, reject) => {
    socket!.once('open', () => {
      socket!.send(JSON.stringify({ type: 'hello', instanceId, token }))
      resolve()
    })
    socket!.once('error', reject)
  })
  socket.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString()) as { type?: string; instanceId?: string }
      if (message.instanceId === instanceId && message.type === 'shutdown') void shutdown()
    } catch { /* ignore malformed manager messages */ }
  })
  setState('STARTING')
  // Provider startup is intentionally deferred until the worker boundary is proven.
  setState('DISCONNECTED')
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
  process.exitCode = 1
})
