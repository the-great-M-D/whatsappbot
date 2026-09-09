export type EventHandler<T> = (event: T) => void | Promise<void>

export interface TaskEventPayload {
  instanceId: string
  taskId: string
  type: string
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT'
  error?: string
}

export interface DomainEventMap {
  MessageReceived: { instanceId: string; messageId: string; chatId: string; senderId: string; chatType: 'private' | 'group'; timestamp: number; text?: string; isFromMe: boolean }
  ConnectionChanged: { instanceId: string; state: string; reason?: string }
  PairingRequired: { instanceId: string; method: 'qr' | 'phone' }
  CommandExecuted: { instanceId: string; command: string; success: boolean; durationMs: number; chatId: string; replyWith?: string; error?: string }
  ScannerMatch: { instanceId: string; source: string; eventId: string; matchedText: string; timestamp: number }
  TaskUpdated: TaskEventPayload
  JobExecuted: { instanceId: string; jobId: string; jobName: string; status: 'SUCCEEDED' | 'FAILED'; taskId: string; error?: string; durationMs: number }
  WorkerError: { instanceId: string; code: string; message: string }
}

export type DomainEventName = keyof DomainEventMap

export class EventBus<Events extends object = DomainEventMap> {
  private readonly handlers = new Map<keyof Events, Set<EventHandler<any>>>()
  on<K extends keyof Events>(type: K, handler: EventHandler<Events[K]>): () => void {
    const set = this.handlers.get(type) ?? new Set<EventHandler<any>>()
    set.add(handler)
    this.handlers.set(type, set)
    return () => set.delete(handler)
  }
  emit<K extends keyof Events>(type: K, event: Events[K]): void {
    for (const handler of [...(this.handlers.get(type) ?? [])]) Promise.resolve().then(() => handler(event)).catch(() => undefined)
  }
  clear(): void { this.handlers.clear() }
}
