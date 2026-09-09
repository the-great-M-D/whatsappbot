import type { EventBus } from '../../domain/events/EventBus'
import type { WhatsAppMessage } from '../../domain/whatsapp/WhatsAppProvider'
import type { ScannerEventStore } from '../../infrastructure/database/repositories/DrizzleScannerStore'

export interface ScannerConfig {
  enabled: boolean
  keywords: string[]
  caseSensitive?: boolean
}

export class ScannerService {
  constructor(private readonly store: ScannerEventStore, private readonly events?: EventBus) {
    events?.on('MessageReceived', (event) => {
      if (event.chatType !== 'group' || event.isFromMe) return
      void this.scan(event.instanceId, { id: event.messageId, chatId: event.chatId, senderId: event.senderId, chatType: event.chatType, timestamp: event.timestamp, text: event.text, isFromMe: event.isFromMe }).catch(() => undefined)
    })
  }

  async getConfig(instanceId: string): Promise<ScannerConfig> { return this.store.getConfig(instanceId) }

  async setConfig(instanceId: string, config: ScannerConfig): Promise<ScannerConfig> {
    return this.store.setConfig(instanceId, {
      enabled: Boolean(config.enabled),
      keywords: [...new Set(config.keywords.map((value) => value.trim()).filter(Boolean).slice(0, 100))],
      caseSensitive: Boolean(config.caseSensitive),
    })
  }

  async listMatches(instanceId: string, limit = 100): Promise<Record<string, unknown>[]> {
    return this.store.listMatches(instanceId, Math.min(Math.max(limit, 1), 500))
  }

  private async scan(instanceId: string, message: WhatsAppMessage): Promise<void> {
    const config = await this.store.getConfig(instanceId)
    if (!config.enabled || !config.keywords.length || !message.text) return
    const haystack = config.caseSensitive ? message.text : message.text.toLowerCase()
    const keyword = config.keywords.find((value) => haystack.includes(config.caseSensitive ? value : value.toLowerCase()))
    if (!keyword) return
    const eventId = await this.store.recordMatch(instanceId, message, keyword)
    this.events?.emit('ScannerMatch', { instanceId, source: 'whatsapp-group', eventId: eventId ?? '', matchedText: keyword, timestamp: message.timestamp })
  }
}
