import { and, asc, eq, gt, isNull } from 'drizzle-orm'
import type { InstanceRecord, InstanceRepository, CreateInstanceInput, UpdateInstanceInput } from '../../../application/instances/InstanceRepository'
import type { V3Database } from '../client'
import { botInstances } from '../schema'

export class DrizzleInstanceRepository implements InstanceRepository {
  constructor(private readonly db: V3Database) {}

  async findById(id: string): Promise<InstanceRecord | null> {
    const rows = await this.db.select().from(botInstances).where(and(eq(botInstances.id, id), isNull(botInstances.deletedAt))).limit(1)
    return rows[0] ? this.map(rows[0]) : null
  }

  async findBySlug(slug: string): Promise<InstanceRecord | null> {
    const rows = await this.db.select().from(botInstances).where(and(eq(botInstances.slug, slug), isNull(botInstances.deletedAt))).limit(1)
    return rows[0] ? this.map(rows[0]) : null
  }

  async list(options: { limit?: number; cursor?: string } = {}): Promise<{ items: InstanceRecord[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100)
    const rows = await this.db.select().from(botInstances)
      .where(and(isNull(botInstances.deletedAt), options.cursor ? gt(botInstances.id, options.cursor) : undefined))
      .orderBy(asc(botInstances.id)).limit(limit + 1)
    const items = rows.slice(0, limit).map((row) => this.map(row))
    return { items, nextCursor: rows.length > limit ? items[items.length - 1]?.id ?? null : null }
  }

  async create(input: CreateInstanceInput): Promise<InstanceRecord> {
    const rows = await this.db.insert(botInstances).values({
      ...(input.id ? { id: input.id } : {}), slug: input.slug, name: input.name, config: input.config ?? {},
    }).returning()
    return this.map(rows[0])
  }

  async update(id: string, input: UpdateInstanceInput): Promise<InstanceRecord> {
    const rows = await this.db.update(botInstances).set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.config !== undefined ? { config: input.config } : {}), updatedAt: new Date(),
    }).where(and(eq(botInstances.id, id), isNull(botInstances.deletedAt))).returning()
    if (!rows[0]) throw new Error(`Instance not found: ${id}`)
    return this.map(rows[0])
  }

  async softDelete(id: string): Promise<void> {
    await this.db.update(botInstances).set({ deletedAt: new Date(), desiredState: 'STOPPED', updatedAt: new Date() })
      .where(and(eq(botInstances.id, id), isNull(botInstances.deletedAt)))
  }

  async setStatus(id: string, status: string): Promise<void> {
    await this.db.update(botInstances).set({ status: status as any, updatedAt: new Date() }).where(eq(botInstances.id, id))
  }

  async setDesiredState(id: string, desiredState: 'RUNNING' | 'STOPPED'): Promise<void> {
    await this.db.update(botInstances).set({ desiredState, updatedAt: new Date() }).where(eq(botInstances.id, id))
  }

  private map(row: typeof botInstances.$inferSelect): InstanceRecord {
    return { id: row.id, slug: row.slug, name: row.name, status: row.status, desiredState: row.desiredState, config: row.config }
  }
}
