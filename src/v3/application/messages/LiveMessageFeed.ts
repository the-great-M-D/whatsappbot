import type { EventBus } from '../../domain/events/EventBus'
import type { WhatsAppMessage } from '../../domain/whatsapp/WhatsAppProvider'

export type LiveMessageEvent = WhatsAppMessage & { instanceId: string }

export class LiveMessageFeed {
  private readonly feeds = new Map<string, LiveMessageEvent[]>()
  private readonly listeners = new Set<(event: LiveMessageEvent) => void>()

  constructor(events: EventBus, private readonly limit = 1000) {
    events.on('MessageReceived', (event) => {
      if (event.chatType !== 'group') return
      const item: LiveMessageEvent = { id: event.messageId, chatId: event.chatId, senderId: event.senderId, chatType: event.chatType, timestamp: event.timestamp, text: event.text, isFromMe: event.isFromMe, instanceId: event.instanceId }
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
