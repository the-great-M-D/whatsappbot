export type TaskStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT'

export interface TaskRecord<T = unknown> {
    id: string
    instanceId: string
    type: string
    status: TaskStatus
    createdAt: number
    startedAt?: number
    finishedAt?: number
    result?: T
    error?: string
}

export interface TaskOptions {
    timeoutMs?: number
}

export class TaskManager {
    private readonly tasks = new Map<string, TaskRecord>()
    private readonly queue: Array<{ record: TaskRecord; work: () => Promise<unknown>; options: TaskOptions }> = []
    private running = 0
    private sequence = 0

    constructor(private readonly maxConcurrency = 20) {}

    submit<T>(instanceId: string, type: string, work: () => Promise<T>, options: TaskOptions = {}): string {
        const id = `${Date.now()}-${++this.sequence}`
        const record: TaskRecord<T> = { id, instanceId, type, status: 'QUEUED', createdAt: Date.now() }
        this.tasks.set(id, record)
        this.queue.push({ record, work, options })
        this.pump()
        return id
    }

    get(id: string): TaskRecord | undefined { return this.tasks.get(id) }
    list(instanceId?: string): TaskRecord[] { return [...this.tasks.values()].filter(t => !instanceId || t.instanceId === instanceId) }

    cancel(id: string): boolean {
        const task = this.tasks.get(id)
        if (!task || task.status !== 'QUEUED') return false
        task.status = 'CANCELLED'
        task.finishedAt = Date.now()
        return true
    }

    private pump(): void {
        while (this.running < this.maxConcurrency && this.queue.length) {
            const item = this.queue.shift()!
            if (item.record.status === 'CANCELLED') continue
            this.running++
            void this.execute(item).finally(() => { this.running--; this.pump() })
        }
    }

    private async execute(item: { record: TaskRecord; work: () => Promise<unknown>; options: TaskOptions }): Promise<void> {
        const { record, work, options } = item
        record.status = 'RUNNING'
        record.startedAt = Date.now()
        let timer: ReturnType<typeof setTimeout> | undefined
        try {
            const operation = work()
            const result = options.timeoutMs
                ? await Promise.race([operation, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Task timed out')), options.timeoutMs) })])
                : await operation
            record.result = result
            record.status = 'SUCCEEDED'
        } catch (error) {
            record.status = error instanceof Error && error.message === 'Task timed out' ? 'TIMED_OUT' : 'FAILED'
            record.error = error instanceof Error ? error.message : String(error)
        } finally {
            if (timer) clearTimeout(timer)
            record.finishedAt = Date.now()
        }
    }
}
