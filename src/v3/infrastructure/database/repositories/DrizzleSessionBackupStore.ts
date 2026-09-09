import { eq } from 'drizzle-orm'
import { whatsappSessions } from '../schema'
import type { V3Database } from '../client'

export interface SessionBackupRecord {
  encryptedBackup: string
  keyVersion: string
  backedUpAt: Date
}

export class DrizzleSessionBackupStore {
  constructor(private readonly db: V3Database) {}

  async save(instanceId: string, backup: SessionBackupRecord): Promise<void> {
    await this.db.insert(whatsappSessions).values({
      instanceId,
      encryptedBackup: backup.encryptedBackup,
      keyVersion: backup.keyVersion,
      backedUpAt: backup.backedUpAt,
    }).onConflictDoUpdate({
      target: whatsappSessions.instanceId,
      set: {
        encryptedBackup: backup.encryptedBackup,
        keyVersion: backup.keyVersion,
        backedUpAt: backup.backedUpAt,
        updatedAt: new Date(),
      },
    })
  }

  async find(instanceId: string): Promise<SessionBackupRecord | null> {
    const [row] = await this.db.select({
      encryptedBackup: whatsappSessions.encryptedBackup,
      keyVersion: whatsappSessions.keyVersion,
      backedUpAt: whatsappSessions.backedUpAt,
    }).from(whatsappSessions).where(eq(whatsappSessions.instanceId, instanceId)).limit(1)
    if (!row?.encryptedBackup || !row.keyVersion || !row.backedUpAt) return null
    return row
  }
}
