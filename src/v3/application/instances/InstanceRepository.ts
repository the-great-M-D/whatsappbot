export interface InstanceRecord {
  id: string
  slug: string
  name: string
  status: string
  desiredState: string
  config: Record<string, unknown>
}

export interface CreateInstanceInput {
  id?: string
  slug: string
  name: string
  config?: Record<string, unknown>
}

export interface UpdateInstanceInput {
  name?: string
  config?: Record<string, unknown>
}

export interface InstanceRepository {
  findById(id: string): Promise<InstanceRecord | null>
  findBySlug(slug: string): Promise<InstanceRecord | null>
  list(options?: { limit?: number; cursor?: string }): Promise<{ items: InstanceRecord[]; nextCursor: string | null }>
  create(input: CreateInstanceInput): Promise<InstanceRecord>
  update(id: string, input: UpdateInstanceInput): Promise<InstanceRecord>
  softDelete(id: string): Promise<void>
  setStatus(id: string, status: string): Promise<void>
  setDesiredState(id: string, desiredState: 'RUNNING' | 'STOPPED'): Promise<void>
}
