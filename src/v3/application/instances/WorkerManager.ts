import type { InstanceState } from '../../domain/instances/InstanceLifecycle'
import type { WhatsAppProviderEvent } from '../../domain/whatsapp/WhatsAppProvider'

export interface WorkerStartOptions {
  instanceId: string
  config: Record<string, unknown>
}

export interface WorkerSnapshot {
  instanceId: string
  pid: number | null
  state: 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'CRASHED'
  startedAt: Date | null
  restartCount: number
  lastExitCode: number | null
  lastExitSignal: NodeJS.Signals | null
}

export interface WorkerManager {
  start(options: WorkerStartOptions): Promise<WorkerSnapshot>
  stop(instanceId: string, timeoutMs?: number): Promise<void>
  restart(options: WorkerStartOptions): Promise<WorkerSnapshot>
  sendText(instanceId: string, chatId: string, text: string): Promise<void>
  has(instanceId: string): boolean
  get(instanceId: string): WorkerSnapshot | null
  shutdown(timeoutMs?: number): Promise<void>
}

export type WorkerLifecycleEvent =
  | { type: 'started'; instanceId: string; pid: number }
  | { type: 'state'; instanceId: string; state: InstanceState }
  | { type: 'provider'; instanceId: string; event: WhatsAppProviderEvent }
  | { type: 'exited'; instanceId: string; code: number | null; signal: NodeJS.Signals | null }
  | { type: 'error'; instanceId: string; error: Error }
  | { type: 'domain'; instanceId: string; name: string; payload: unknown }

export interface WorkerEventSource {
  onEvent(listener: (event: WorkerLifecycleEvent) => void): () => void
}
