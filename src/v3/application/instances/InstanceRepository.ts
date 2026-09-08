import type { V3Database } from '../../infrastructure/database/client'
import { botInstances } from '../../infrastructure/database/schema'
import { eq } from 'drizzle-orm'

export interface InstanceRecord {
  id: string
  slug: string
  name: string
  status: string
  desiredState: string
  config: Record<string, unknown>
}

export interface InstanceRepository {
  findById(id: string): Promise<InstanceRecord | null>
  findBySlug(slug: string): Promise<InstanceRecord | null>
  setStatus(id: string, status: string): Promise<void>
  setDesiredState(id: string, desiredState: 'RUNNING' | 'STOPPED'): Promise<void>
}

export class DrizzleInstanceRepository implements InstanceRepository {
  constructor(private readonly db: V3Database) {}

  async findById(id: string): Promise<InstanceRecord | null> {
    const rows = await this.db.select().from(botInstances).where(eq(botInstances.id, id)).limit(1)
    return rows[0] ? this.map(rows[0]) : null
  }

  async findBySlug(slug: string): Promise<InstanceRecord | null> {
    const rows = await this.db.select().from(botInstances).where(eq(botInstances.slug, slug)).limit(1)
    return rows[0] ? this.map(rows[0]) : null
  }

  async setStatus(id: string, status: string): Promise<void> {
    await this.db.update(botInstances).set({ status: status as any, updatedAt: new Date() }).where(eq(botInstances.id, id))
  }

  async setDesiredState(id: string, desiredState: 'RUNNING' | 'STOPPED'): Promise<void> {
    await this.db.update(botInstances).set({ desiredState, updatedAt: new Date() }).where(eq(botInstances.id, id))
  }

  private map(row: typeof botInstances.$inferSelect): InstanceRecord {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      status: row.status,
      desiredState: row.desiredState,
      config: row.config,
    }
  }
}
