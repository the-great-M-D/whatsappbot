import type { WorkerEventSource } from '../instances/WorkerManager'
import type { WhatsAppMessage, WhatsAppProviderEvent } from '../../domain/whatsapp/WhatsAppProvider'

export type LiveMessageEvent = WhatsAppMessage & { instanceId: string }

export class LiveMessageFeed {
  private readonly feeds = new Map<string, LiveMessageEvent[]>()
  private readonly listeners = new Set<(event: LiveMessageEvent) => void>()

  constructor(source: WorkerEventSource, private readonly limit = 1000) {
    source.onEvent((event) => {
      if (event.type !== 'provider') return
      const provider = event.event as WhatsAppProviderEvent
      if (provider.type !== 'message' || provider.message.chatType !== 'group') return
      const item: LiveMessageEvent = { ...provider.message, instanceId: event.instanceId }
      const feed = this.feeds.get(event.instanceId) ?? []
      feed.push(item)
      if (feed.length > this.limit) feed.splice(0, feed.length - this.limit)
      this.feeds.set(event.instanceId, feed)
      for (const listener of this.listeners) listener(item)
    })
  }

  list(instanceId: string, limit = 100): LiveMessageEvent[] {
    return (this.feeds.get(instanceId) ?? []).slice(-Math.min(limit, this.limit))
  }

  subscribe(listener: (event: LiveMessageEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}
