import type { WorkerEventSource } from '../instances/WorkerManager'
import type { WhatsAppProviderEvent, WhatsAppMessage } from '../../domain/whatsapp/WhatsAppProvider'
import type { ScannerEventStore } from '../../infrastructure/database/repositories/DrizzleScannerStore'

export interface ScannerConfig {
  enabled: boolean
  keywords: string[]
  caseSensitive?: boolean
}

export class ScannerService {
  constructor(private readonly store: ScannerEventStore, source: WorkerEventSource) {
    source.onEvent((event) => {
      if (event.type !== 'provider') return
      const provider = event.event as WhatsAppProviderEvent
      if (provider.type !== 'message' || provider.message.chatType !== 'group') return
      void this.scan(event.instanceId, provider.message).catch(() => undefined)
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
    if (keyword) await this.store.recordMatch(instanceId, message, keyword)
  }
}
