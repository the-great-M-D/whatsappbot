import type { EventBus } from '../../domain/events/EventBus'
import type { TaskManager } from '../../domain/tasks/TaskManager'
import type { DrizzleJobStore, JobRecord } from '../../infrastructure/database/repositories/DrizzleJobStore'

export type JobDispatcher = (job: JobRecord) => Promise<void>

/**
 * Polls the `jobs` table for due jobs and executes each one as a TaskManager
 * task. Job outcomes are written back to the job row and published as
 * JobExecuted domain events for the dashboard.
 */
export class JobScheduler {
  private timer?: NodeJS.Timeout
  private readonly inflight = new Set<string>()
  private stopping = false

  constructor(
    private readonly jobs: DrizzleJobStore,
    private readonly tasks: TaskManager,
    private readonly events: EventBus,
    private readonly dispatch: JobDispatcher,
    private readonly intervalMs = 30_000,
  ) {}

  start(): void {
    if (this.timer) return
    this.stopping = false
    const tick = () => { if (this.stopping) return; void this.tick().catch(() => undefined) }
    this.timer = setInterval(tick, this.intervalMs)
    this.timer.unref?.()
    setTimeout(tick, 1_000).unref?.()
  }

  async stop(): Promise<void> {
    this.stopping = true
    if (this.timer) clearInterval(this.timer)
    this.timer = undefined
  }

  async tick(): Promise<void> {
    const due = await this.jobs.listDue(new Date())
    for (const job of due) {
      if (this.inflight.has(job.id) || !job.enabled) continue
      this.inflight.add(job.id)
      let taskId = ''
      taskId = this.tasks.submit(job.instanceId, `job:${job.type}`, async () => {
        const startedAt = Date.now()
        try {
          await this.dispatch(job)
          await this.jobs.markRun(job.id, 'SUCCEEDED', 0)
          this.events.emit('JobExecuted', { instanceId: job.instanceId, jobId: job.id, jobName: job.name, status: 'SUCCEEDED', taskId, durationMs: Date.now() - startedAt })
        } catch (error) {
          await this.jobs.markRun(job.id, 'FAILED', job.failureCount + 1)
          this.events.emit('JobExecuted', { instanceId: job.instanceId, jobId: job.id, jobName: job.name, status: 'FAILED', taskId, error: error instanceof Error ? error.message : String(error), durationMs: Date.now() - startedAt })
        } finally {
          this.inflight.delete(job.id)
        }
        return { job: job.name }
      })
    }
  }
}
