import type { EventBus } from '../../domain/events/EventBus'
import type { TaskRecord } from '../../domain/tasks/TaskManager'
import type { DrizzleTaskStore } from '../../infrastructure/database/repositories/DrizzleTaskStore'

/**
 * Creates the TaskManager transition hook that mirrors task state into the
 * `tasks` table and publishes TaskUpdated domain events for the dashboard.
 */
export function createTaskRecorder(store: DrizzleTaskStore, events: EventBus): (record: TaskRecord) => void {
  // TaskManager transitions fire synchronously; serialise each task's writes so
  // a fast SUCCEEDED can never overtake its own QUEUED insert.
  const pending = new Map<string, Promise<void>>()
  return (record: TaskRecord) => {
    const write = (previous: Promise<void>) =>
      previous
        .catch(() => undefined)
        .then(async () => {
          try {
            if (record.status === 'QUEUED') await store.create({ ...record })
            else await store.update({ ...record })
          } catch (error) {
            // Task persistence must never break task execution, but stay visible.
            console.error(`task store mirror failed for ${record.id} (${record.status})`, error instanceof Error ? error.message : String(error))
          }
        })
    const chained = write(pending.get(record.id) ?? Promise.resolve())
    pending.set(record.id, chained)
    if (record.status === 'SUCCEEDED' || record.status === 'FAILED' || record.status === 'CANCELLED' || record.status === 'TIMED_OUT') void chained.then(() => pending.delete(record.id))
    // The dashboard event reflects the authoritative in-memory transition and
    // is published even if the mirror write failed.
    events.emit('TaskUpdated', { instanceId: record.instanceId, taskId: record.id, type: record.type, status: record.status, error: record.error ?? null })
  }
}
