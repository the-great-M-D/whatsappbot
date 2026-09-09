import { desc, eq } from 'drizzle-orm'
import { scannerConfigs, scannerEvents } from '../schema'
import type { V3Database } from '../client'
import type { ScannerConfig } from '../../../application/scanner/ScannerService'
import type { WhatsAppMessage } from '../../../domain/whatsapp/WhatsAppProvider'

export interface ScannerEventStore {
  getConfig(instanceId: string): Promise<ScannerConfig>
  setConfig(instanceId: string, config: ScannerConfig): Promise<ScannerConfig>
  recordMatch(instanceId: string, message: WhatsAppMessage, keyword: string): Promise<void>
  listMatches(instanceId: string, limit: number): Promise<Record<string, unknown>[]>
}

export class DrizzleScannerStore implements ScannerEventStore {
  constructor(private readonly db: V3Database) {}

  async getConfig(instanceId: string): Promise<ScannerConfig> {
    const [row] = await this.db.select().from(scannerConfigs).where(eq(scannerConfigs.instanceId, instanceId)).limit(1)
    if (!row) return { enabled: false, keywords: [], caseSensitive: false }
    const config = row.config as Record<string, unknown>
    return { enabled: row.enabled, keywords: Array.isArray(config.keywords) ? config.keywords.filter((v): v is string => typeof v === 'string') : [], caseSensitive: config.caseSensitive === true }
  }

  async setConfig(instanceId: string, config: ScannerConfig): Promise<ScannerConfig> {
    const stored = { keywords: config.keywords, caseSensitive: config.caseSensitive === true }
    await this.db.insert(scannerConfigs).values({ instanceId, enabled: config.enabled, config: stored }).onConflictDoUpdate({
      target: scannerConfigs.instanceId,
      set: { enabled: config.enabled, config: stored, updatedAt: new Date() },
    })
    return config
  }

  async recordMatch(instanceId: string, message: WhatsAppMessage, keyword: string): Promise<void> {
    await this.db.insert(scannerEvents).values({ instanceId, source: 'whatsapp-group', externalId: message.id, status: 'MATCHED', payload: { chatId: message.chatId, senderId: message.senderId, text: message.text, keyword, timestamp: message.timestamp } })
  }

  async listMatches(instanceId: string, limit: number): Promise<Record<string, unknown>[]> {
    const rows = await this.db.select().from(scannerEvents).where(eq(scannerEvents.instanceId, instanceId)).orderBy(desc(scannerEvents.matchedAt)).limit(limit)
    return rows.map((row) => ({ id: row.id, source: row.source, status: row.status, payload: row.payload, matchedAt: row.matchedAt }))
  }
}
