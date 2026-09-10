import type { InstanceRepository, InstanceRecord } from './InstanceRepository'
import { assertTransition, type DesiredState, type InstanceState } from '../../domain/instances/InstanceLifecycle'
import type { WorkerEventSource, WorkerLifecycleEvent, WorkerManager, WorkerStartOptions } from './WorkerManager'

export class InstanceNotFoundError extends Error {
  constructor(public readonly instanceId: string) { super(`Instance not found: ${instanceId}`); this.name = 'InstanceNotFoundError' }
}

export class InstanceManager {
  private readonly crashHistory = new Map<string, number[]>()
  private readonly eventQueues = new Map<string, Promise<void>>()
  private unsubscribe?: () => void

  constructor(private readonly repository: InstanceRepository, private readonly workers: WorkerManager & WorkerEventSource) {
    this.unsubscribe = workers.onEvent((event) => this.enqueueWorkerEvent(event))
  }

  /**
   * Providers emit rapid state bursts (CONNECTING -> CONNECTED in the same
   * tick); handle each instance's events strictly in order so lifecycle
   * transitions never read a stale status concurrently.
   */
  private enqueueWorkerEvent(event: WorkerLifecycleEvent): void {
    const queue = this.eventQueues.get(event.instanceId) ?? Promise.resolve()
    const next = queue.then(() => this.handleWorkerEvent(event)).catch(() => undefined)
    this.eventQueues.set(event.instanceId, next)
    void next.then(() => {
      if (this.eventQueues.get(event.instanceId) === next) this.eventQueues.delete(event.instanceId)
    })
  }

  async start(instanceId: string): Promise<InstanceRecord> {
    const instance = await this.require(instanceId)
    await this.repository.setDesiredState(instanceId, 'RUNNING')
    await this.transition(instance, 'STARTING')
    try {
      await this.workers.start(this.workerOptions(instance))
      return this.require(instanceId)
    } catch (error) {
      await this.repository.setStatus(instanceId, 'CRASHED').catch(() => undefined)
      throw error
    }
  }

  async stop(instanceId: string): Promise<InstanceRecord> {
    const instance = await this.require(instanceId)
    await this.repository.setDesiredState(instanceId, 'STOPPED')
    if (this.workers.has(instanceId)) await this.transition(instance, 'STOPPING').catch(() => undefined)
    await this.workers.stop(instanceId)
    await this.repository.setStatus(instanceId, 'STOPPED')
    return this.require(instanceId)
  }

  async restart(instanceId: string): Promise<InstanceRecord> {
    const instance = await this.require(instanceId)
    await this.repository.setDesiredState(instanceId, 'RUNNING')
    await this.transition(instance, 'STOPPING').catch(() => undefined)
    await this.workers.restart(this.workerOptions(instance))
    await this.repository.setStatus(instanceId, 'STARTING')
    return this.require(instanceId)
  }

  async reconnect(instanceId: string): Promise<InstanceRecord> {
    const instance = await this.require(instanceId)
    await this.repository.setDesiredState(instanceId, 'RUNNING')
    await this.transition(instance, 'RECONNECTING').catch(() => undefined)
    if (!this.workers.has(instanceId)) await this.workers.start(this.workerOptions(instance))
    return this.require(instanceId)
  }

  async setDesiredState(instanceId: string, desiredState: DesiredState): Promise<InstanceRecord> {
    if (desiredState === 'RUNNING') return this.start(instanceId)
    return this.stop(instanceId)
  }

  async reconcile(): Promise<void> {
    // Reconciliation becomes active once the repository exposes a list operation.
    // Keeping this hook in the manager establishes the startup lifecycle boundary.
  }

  async shutdown(): Promise<void> {
    this.unsubscribe?.()
    await this.workers.shutdown()
  }

  private workerOptions(instance: InstanceRecord): WorkerStartOptions { return { instanceId: instance.id, config: instance.config } }

  private async require(instanceId: string): Promise<InstanceRecord> {
    const instance = await this.repository.findById(instanceId)
    if (!instance) throw new InstanceNotFoundError(instanceId)
    return instance
  }

  private async transition(instance: InstanceRecord, next: InstanceState): Promise<void> {
    assertTransition(instance.status as InstanceState, next)
    await this.repository.setStatus(instance.id, next)
  }

  private async handleWorkerEvent(event: WorkerLifecycleEvent): Promise<void> {
    if (event.type === 'started') {
      await this.repository.setStatus(event.instanceId, 'STARTING').catch(() => undefined)
    } else if (event.type === 'state') {
      const instance = await this.repository.findById(event.instanceId)
      if (!instance) return
      if (instance.status !== event.state) assertTransition(instance.status as InstanceState, event.state)
      await this.repository.setStatus(event.instanceId, event.state)
    } else if (event.type === 'exited') {
      const instance = await this.repository.findById(event.instanceId)
      if (!instance) return
      if (instance.desiredState === 'RUNNING') {
        const now = Date.now()
        const history = (this.crashHistory.get(event.instanceId) ?? []).filter((time) => now - time < 5 * 60_000)
        history.push(now)
        this.crashHistory.set(event.instanceId, history)
        await this.repository.setStatus(event.instanceId, history.length >= 5 ? 'CRASHED' : 'RECONNECTING')
      } else await this.repository.setStatus(event.instanceId, 'STOPPED')
    } else if (event.type === 'error') {
      await this.repository.setStatus(event.instanceId, 'CRASHED').catch(() => undefined)
    }
  }
}
