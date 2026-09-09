import type { EventBus } from '../../domain/events/EventBus'
import type { TaskRecord } from '../../domain/tasks/TaskManager'
import type { DrizzleTaskStore } from '../../infrastructure/database/repositories/DrizzleTaskStore'

/**
 * Creates the TaskManager transition hook that mirrors task state into the
 * `tasks` table and publishes TaskUpdated domain events for the dashboard.
 */
export function createTaskRecorder(store: DrizzleTaskStore, events: EventBus): (record: TaskRecord) => void {
  return (record: TaskRecord) => {
    void (async () => {
      try {
        if (record.status === 'QUEUED') await store.create({ ...record })
        else await store.update({ ...record })
        events.emit('TaskUpdated', { instanceId: record.instanceId, taskId: record.id, type: record.type, status: record.status, error: record.error })
      } catch { /* task persistence must never break task execution */ }
    })()
  }
}
