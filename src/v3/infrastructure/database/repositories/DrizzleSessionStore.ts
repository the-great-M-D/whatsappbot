import { eq } from 'drizzle-orm'
import type { SessionRecord } from '../../../application/auth/AuthTypes'
import type { SessionStore } from '../../../application/auth/SessionService'
import { dashboardSessions } from '../schema'
import type { V3Database } from '../client'

export class DrizzleSessionStore implements SessionStore {
  constructor(private readonly db: V3Database) {}

  async create(input: { userId: string; tokenHash: string; expiresAt: Date; ip?: string; userAgent?: string }): Promise<SessionRecord> {
    const [row] = await this.db.insert(dashboardSessions).values({
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      ip: input.ip,
      userAgent: input.userAgent,
    }).returning()
    return this.map(row)
  }

  async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const [row] = await this.db.select().from(dashboardSessions).where(eq(dashboardSessions.tokenHash, tokenHash)).limit(1)
    return row ? this.map(row) : null
  }

  async touch(id: string, lastSeenAt: Date): Promise<void> {
    await this.db.update(dashboardSessions).set({ lastSeenAt }).where(eq(dashboardSessions.id, id))
  }

  async revoke(id: string, revokedAt: Date): Promise<void> {
    await this.db.update(dashboardSessions).set({ revokedAt }).where(eq(dashboardSessions.id, id))
  }

  private map(row: typeof dashboardSessions.$inferSelect): SessionRecord {
    return { id: row.id, userId: row.userId, tokenHash: row.tokenHash, expiresAt: row.expiresAt, lastSeenAt: row.lastSeenAt, revokedAt: row.revokedAt }
  }
}
