import type { EventBus, DomainEventName } from '../../domain/events/EventBus'
import type { WorkerEventSource } from '../instances/WorkerManager'
import type { WhatsAppProviderEvent } from '../../domain/whatsapp/WhatsAppProvider'

export type DomainEventSink = <T>(name: DomainEventName, payload: T) => void

/**
 * Bridges raw worker lifecycle/provider events onto the shared domain EventBus
 * so that persistence services, the scheduler and the dashboard gateway can
 * subscribe to a single normalized stream.
 */
export class WorkerEventBridge {
  private readonly unsubscribe: () => void

  constructor(private readonly events: EventBus, source: WorkerEventSource) {
    this.unsubscribe = source.onEvent((event) => this.handle(event))
  }

  close(): void { this.unsubscribe() }

  private handle(event: Parameters<Parameters<WorkerEventSource['onEvent']>[0]>[0]): void {
    switch (event.type) {
      case 'provider': {
        const provider = event.event as WhatsAppProviderEvent
        if (provider.type === 'message') {
          this.events.emit('MessageReceived', { instanceId: event.instanceId, messageId: provider.message.id, chatId: provider.message.chatId, senderId: provider.message.senderId, chatType: provider.message.chatType, timestamp: provider.message.timestamp, text: provider.message.text, isFromMe: provider.message.isFromMe })
        } else if (provider.type === 'connection') {
          this.events.emit('ConnectionChanged', { instanceId: event.instanceId, state: provider.state, reason: provider.reason })
        } else if (provider.type === 'qr' || provider.type === 'pairing-code') {
          this.events.emit('PairingRequired', { instanceId: event.instanceId, method: provider.type === 'qr' ? 'qr' : 'phone' })
        }
        return
      }
      case 'domain': {
        const payload = event as unknown as { name: DomainEventName; payload: unknown }
        // Workers may forward domain events (e.g. CommandExecuted) straight onto the bus.
        this.events.emit(payload.name, payload.payload as never)
        return
      }
      case 'error': {
        const error = event as unknown as { error: Error }
        this.events.emit('WorkerError', { instanceId: event.instanceId, code: 'WORKER_ERROR', message: error.error.message })
        return
      }
      default:
        return
    }
  }
}
