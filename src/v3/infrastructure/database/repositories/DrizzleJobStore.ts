import { and, asc, eq, isNull, lte, or } from 'drizzle-orm'
import { jobs } from '../schema'
import type { V3Database } from '../client'

export interface JobRecord {
  id: string
  instanceId: string
  name: string
  type: string
  schedule: string
  timezone: string
  enabled: boolean
  payload: Record<string, unknown>
  nextRunAt: string | null
  lastRunAt: string | null
  lastStatus: string | null
  failureCount: number
  createdAt: string
}

export interface CreateJobInput {
  instanceId: string
  name: string
  type: string
  schedule: string
  timezone?: string
  payload?: Record<string, unknown>
  enabled?: boolean
}

/** Durable job definitions polled by the scheduler. */
export class DrizzleJobStore {
  constructor(private readonly db: V3Database) {}

  async create(input: CreateJobInput): Promise<JobRecord> {
    const intervalMs = parseIntervalMs(input.schedule)
    const [row] = await this.db.insert(jobs).values({
      instanceId: input.instanceId,
      name: input.name.slice(0, 160),
      type: input.type.slice(0, 100),
      schedule: input.schedule.slice(0, 160),
      timezone: (input.timezone ?? 'UTC').slice(0, 80),
      enabled: input.enabled ?? true,
      payload: input.payload ?? {},
      nextRunAt: new Date(Date.now() + intervalMs),
    }).returning()
    return this.toRecord(row!)
  }

  async list(instanceId?: string): Promise<JobRecord[]> {
    const rows = await this.db.select().from(jobs)
      .where(instanceId ? eq(jobs.instanceId, instanceId) : undefined)
      .orderBy(asc(jobs.createdAt)).limit(200)
    return rows.map((row) => this.toRecord(row))
  }

  async findById(id: string): Promise<JobRecord | null> {
    const [row] = await this.db.select().from(jobs).where(eq(jobs.id, id)).limit(1)
    return row ? this.toRecord(row) : null
  }

  async setEnabled(id: string, enabled: boolean): Promise<JobRecord | null> {
    const intervalMs = 60_000
    const [row] = await this.db.update(jobs).set({ enabled, nextRunAt: enabled ? new Date(Date.now() + intervalMs) : null, updatedAt: new Date() })
      .where(eq(jobs.id, id)).returning()
    return row ? this.toRecord(row) : null
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(jobs).where(eq(jobs.id, id))
  }

  /** Jobs due for a run: enabled, and (no nextRunAt) or (nextRunAt <= now). */
  async listDue(now: Date): Promise<JobRecord[]> {
    const rows = await this.db.select().from(jobs)
      .where(and(eq(jobs.enabled, true), or(isNull(jobs.nextRunAt), lte(jobs.nextRunAt, now))))
      .limit(100)
    return rows.map((row) => this.toRecord(row))
  }

  async markRun(id: string, status: 'SUCCEEDED' | 'FAILED', failureCount: number): Promise<void> {
    const [current] = await this.db.select({ schedule: jobs.schedule }).from(jobs).where(eq(jobs.id, id)).limit(1)
    const intervalMs = current ? parseIntervalMs(current.schedule) : 60_000
    await this.db.update(jobs).set({
      lastRunAt: new Date(),
      lastStatus: status,
      failureCount,
      nextRunAt: new Date(Date.now() + intervalMs),
      updatedAt: new Date(),
    }).where(eq(jobs.id, id))
  }

  private toRecord(row: typeof jobs.$inferSelect): JobRecord {
    return {
      id: row.id,
      instanceId: row.instanceId,
      name: row.name,
      type: row.type,
      schedule: row.schedule,
      timezone: row.timezone,
      enabled: row.enabled,
      payload: row.payload,
      nextRunAt: row.nextRunAt?.toISOString() ?? null,
      lastRunAt: row.lastRunAt?.toISOString() ?? null,
      lastStatus: row.lastStatus,
      failureCount: row.failureCount,
      createdAt: row.createdAt.toISOString(),
    }
  }
}

/**
 * Schedule format for phase 1: either a plain integer of seconds ("30", "300")
 * or an "interval:<seconds>" form. Cron support is a planned follow-up.
 */
export function parseIntervalMs(schedule: string): number {
  const value = schedule.trim().toLowerCase()
  const seconds = value.startsWith('interval:') ? Number(value.slice('interval:'.length)) : Number(value)
  if (!Number.isFinite(seconds) || seconds < 1 || seconds > 86_400) throw new Error('Job schedule must be 1..86400 seconds, e.g. "30" or "interval:300"')
  return seconds * 1000
}
