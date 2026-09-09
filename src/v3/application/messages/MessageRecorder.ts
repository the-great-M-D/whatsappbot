import type { EventBus } from '../../domain/events/EventBus'
import type { DrizzleMessageStore } from '../../infrastructure/database/repositories/DrizzleMessageStore'

/**
 * Subscribes to MessageReceived domain events and persists every inbound
 * message into the `messages` table so history survives restarts.
 */
export class MessageRecorder {
  private readonly unsubscribe: () => void

  constructor(private readonly store: DrizzleMessageStore, events: EventBus) {
    this.unsubscribe = events.on('MessageReceived', (event) => {
      // Privacy rule: inbound private messages are never persisted.
      // Group messages and our own outbound messages are stored for history.
      if (event.chatType !== 'group' && !event.isFromMe) return
      void this.store.record(event.instanceId, {
        id: event.messageId,
        chatId: event.chatId,
        senderId: event.senderId,
        chatType: event.chatType,
        timestamp: event.timestamp,
        text: event.text,
        isFromMe: event.isFromMe,
      }).catch(() => undefined)
    })
  }

  close(): void { this.unsubscribe() }
}
