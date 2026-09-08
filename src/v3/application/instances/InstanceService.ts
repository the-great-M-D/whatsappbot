import { randomUUID } from 'node:crypto'
import type { InstanceManager } from './InstanceManager'
import type { CreateInstanceInput, InstanceRecord, InstanceRepository, UpdateInstanceInput } from './InstanceRepository'

export class InstanceConflictError extends Error {}

export class InstanceService {
  constructor(private readonly repository: InstanceRepository, private readonly manager: InstanceManager) {}

  list(options?: { limit?: number; cursor?: string }) { return this.repository.list(options) }

  async get(id: string): Promise<InstanceRecord> {
    const instance = await this.repository.findById(id)
    if (!instance) throw new Error(`Instance not found: ${id}`)
    return instance
  }

  async create(input: CreateInstanceInput): Promise<InstanceRecord> {
    if (await this.repository.findBySlug(input.slug)) throw new InstanceConflictError(`Instance slug already exists: ${input.slug}`)
    return this.repository.create({ ...input, id: input.id ?? randomUUID() })
  }

  async update(id: string, input: UpdateInstanceInput): Promise<InstanceRecord> { return this.repository.update(id, input) }

  async delete(id: string): Promise<void> {
    const instance = await this.get(id)
    if (instance.desiredState === 'RUNNING') await this.manager.stop(id)
    await this.repository.softDelete(id)
  }

  start(id: string) { return this.manager.start(id) }
  stop(id: string) { return this.manager.stop(id) }
  restart(id: string) { return this.manager.restart(id) }
  reconnect(id: string) { return this.manager.reconnect(id) }
}
