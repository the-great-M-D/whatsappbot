import { desc, eq } from 'drizzle-orm'
import { tasks } from '../schema'
import type { V3Database } from '../client'
import type { TaskRecord, TaskStatus } from '../../../domain/tasks/TaskManager'

export interface StoredTask {
  id: string
  instanceId: string
  type: string
  status: TaskStatus
  payload: Record<string, unknown>
  progress: number
  error: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
}

/** Durable mirror of the in-process TaskManager queue. */
export class DrizzleTaskStore {
  constructor(private readonly db: V3Database) {}

  async create(record: TaskRecord): Promise<void> {
    await this.db.insert(tasks).values({
      id: record.id,
      instanceId: record.instanceId,
      type: record.type.slice(0, 100),
      status: record.status,
      payload: { args: record.result ?? null },
    }).onConflictDoNothing({ target: tasks.id })
  }

  async update(record: TaskRecord): Promise<void> {
    await this.db.update(tasks).set({
      status: record.status,
      error: record.error ? record.error.slice(0, 2000) : null,
      startedAt: record.startedAt ? new Date(record.startedAt) : null,
      finishedAt: record.finishedAt ? new Date(record.finishedAt) : null,
    }).where(eq(tasks.id, record.id))
  }

  async list(instanceId: string, limit = 50): Promise<StoredTask[]> {
    const rows = await this.db.select({
      id: tasks.id,
      instanceId: tasks.instanceId,
      type: tasks.type,
      status: tasks.status,
      payload: tasks.payload,
      progress: tasks.progress,
      error: tasks.error,
      startedAt: tasks.startedAt,
      finishedAt: tasks.finishedAt,
      createdAt: tasks.createdAt,
    }).from(tasks).where(eq(tasks.instanceId, instanceId))
      .orderBy(desc(tasks.createdAt)).limit(Math.min(Math.max(limit, 1), 200))
    return rows.map((row) => ({
      ...row,
      startedAt: row.startedAt?.toISOString() ?? null,
      finishedAt: row.finishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }))
  }
}
