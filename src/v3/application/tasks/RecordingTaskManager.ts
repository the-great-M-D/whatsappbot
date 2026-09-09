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
    // TaskManager mutates the same record object across transitions; snapshot it
    // so each mirrored write sees the state at its own transition.
    const snapshot: TaskRecord = { ...record }
    const write = (previous: Promise<void>) =>
      previous
        .catch(() => undefined)
        .then(async () => {
          try {
            if (snapshot.status === 'QUEUED') await store.create({ ...snapshot })
            else await store.update({ ...snapshot })
          } catch (error) {
            // Task persistence must never break task execution, but stay visible.
            console.error(`task store mirror failed for ${snapshot.id} (${snapshot.status})`, error instanceof Error ? error.message : String(error))
          }
        })
    const chained = write(pending.get(snapshot.id) ?? Promise.resolve())
    pending.set(snapshot.id, chained)
    if (['SUCCEEDED', 'FAILED', 'CANCELLED', 'TIMED_OUT'].includes(snapshot.status)) void chained.then(() => pending.delete(snapshot.id))
    // The dashboard event reflects the authoritative in-memory transition and
    // is published even if the mirror write failed. The field is `taskType` so
    // the gateway's `payload.type` stays the event name.
    events.emit('TaskUpdated', { instanceId: snapshot.instanceId, taskId: snapshot.id, taskType: snapshot.type, status: snapshot.status, error: snapshot.error ?? null })
  }
}
