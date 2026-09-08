import { fork, type ChildProcess } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { join } from 'node:path'
import { WebSocketServer, WebSocket, type WebSocket as WebSocketType } from 'ws'
import type { WorkerEventSource, WorkerLifecycleEvent, WorkerManager as WorkerManagerContract, WorkerSnapshot, WorkerStartOptions } from '../../application/instances/WorkerManager'
import type { WhatsAppProviderEvent } from '../../domain/whatsapp/WhatsAppProvider'

interface ManagedWorker { child: ChildProcess; token: string; socket?: WebSocketType; snapshot: WorkerSnapshot }

export class ProcessWorkerManager extends EventEmitter implements WorkerManagerContract, WorkerEventSource {
  private readonly workers = new Map<string, ManagedWorker>()
  private readonly entryPath = join(__dirname, 'worker-entry.js')
  private readonly server = new WebSocketServer({ host: '127.0.0.1', port: 0 })
  private serverReady: Promise<void>

  constructor() {
    super()
    this.serverReady = new Promise((resolve, reject) => { this.server.once('listening', () => resolve()); this.server.once('error', reject) })
    this.server.on('connection', (socket) => {
      socket.once('message', (raw) => {
        try {
          const hello = JSON.parse(raw.toString()) as { type?: string; instanceId?: string; token?: string }
          if (hello.type !== 'hello' || !hello.instanceId || !hello.token) return socket.close(1008, 'invalid hello')
          const worker = this.workers.get(hello.instanceId)
          if (!worker || worker.token !== hello.token) return socket.close(1008, 'unauthorized')
          worker.socket = socket
          socket.on('message', (data) => this.handleWorkerMessage(hello.instanceId!, data.toString()))
        } catch { socket.close(1003, 'invalid message') }
      })
    })
  }

  async start(options: WorkerStartOptions): Promise<WorkerSnapshot> {
    await this.serverReady
    const existing = this.workers.get(options.instanceId)
    if (existing?.child.connected) return { ...existing.snapshot }
    if (existing) this.workers.delete(options.instanceId)
    const token = randomBytes(32).toString('hex')
    const snapshot: WorkerSnapshot = { instanceId: options.instanceId, pid: null, state: 'STARTING', startedAt: new Date(), restartCount: existing?.snapshot.restartCount ?? 0, lastExitCode: null, lastExitSignal: null }
    const address = this.server.address()
    if (!address || typeof address === 'string') throw new Error('Worker WebSocket server is not listening')
    const child = fork(this.entryPath, [], { env: { ...process.env, V3_WORKER_INSTANCE_ID: options.instanceId, V3_WORKER_TOKEN: token, V3_WORKER_WS_URL: `ws://127.0.0.1:${address.port}`, V3_WORKER_CONFIG: JSON.stringify(options.config) }, stdio: ['ignore', 'inherit', 'inherit', 'ipc'] })
    snapshot.pid = child.pid ?? null
    const managed: ManagedWorker = { child, token, snapshot }
    this.workers.set(options.instanceId, managed)
    child.on('error', (error) => this.emitEvent({ type: 'error', instanceId: options.instanceId, error }))
    child.on('exit', (code, signal) => { snapshot.state = 'CRASHED'; snapshot.lastExitCode = code; snapshot.lastExitSignal = signal; this.workers.delete(options.instanceId); this.emitEvent({ type: 'exited', instanceId: options.instanceId, code, signal }) })
    this.emitEvent({ type: 'started', instanceId: options.instanceId, pid: snapshot.pid ?? -1 })
    return { ...snapshot }
  }

  async stop(instanceId: string, timeoutMs = 10_000): Promise<void> {
    const worker = this.workers.get(instanceId)
    if (!worker) return
    worker.snapshot.state = 'STOPPING'
    if (worker.socket?.readyState === WebSocket.OPEN) worker.socket.send(JSON.stringify({ type: 'shutdown', instanceId }))
    await new Promise<void>((resolve) => {
      let done = false
      const finish = () => { if (done) return; done = true; clearTimeout(timer); resolve() }
      const timer = setTimeout(() => { if (!worker.child.killed) worker.child.kill('SIGTERM'); setTimeout(() => { if (!worker.child.killed) worker.child.kill('SIGKILL'); finish() }, 1000).unref() }, timeoutMs)
      worker.child.once('exit', finish)
    })
  }

  async restart(options: WorkerStartOptions): Promise<WorkerSnapshot> {
    const previous = this.workers.get(options.instanceId)?.snapshot
    await this.stop(options.instanceId)
    const next = await this.start(options)
    next.restartCount = (previous?.restartCount ?? 0) + 1
    const worker = this.workers.get(options.instanceId)
    if (worker) worker.snapshot.restartCount = next.restartCount
    return next
  }

  has(instanceId: string): boolean { return this.workers.has(instanceId) }
  get(instanceId: string): WorkerSnapshot | null { const worker = this.workers.get(instanceId); return worker ? { ...worker.snapshot } : null }
  onEvent(listener: (event: WorkerLifecycleEvent) => void): () => void { this.on('worker-event', listener); return () => this.off('worker-event', listener) }
  async shutdown(timeoutMs = 10_000): Promise<void> { await Promise.all([...this.workers.keys()].map((id) => this.stop(id, timeoutMs))); await new Promise<void>((resolve) => this.server.close(() => resolve())) }

  private handleWorkerMessage(instanceId: string, raw: string): void {
    try {
      const message = JSON.parse(raw) as { type?: string; state?: unknown; event?: WhatsAppProviderEvent }
      if (message.type === 'state' && typeof message.state === 'string') this.emitEvent({ type: 'state', instanceId, state: message.state as any })
      else if (message.type === 'provider' && message.event) this.emitEvent({ type: 'provider', instanceId, event: message.event })
    } catch { /* malformed worker messages are ignored */ }
  }
  private emitEvent(event: WorkerLifecycleEvent): void { this.emit('worker-event', event) }
}
