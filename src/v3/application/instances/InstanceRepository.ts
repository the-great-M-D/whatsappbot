export interface InstanceRecord {
  id: string
  slug: string
  name: string
  status: string
  desiredState: string
  config: Record<string, unknown>
}

export interface InstanceRepository {
  findById(id: string): Promise<InstanceRecord | null>
  findBySlug(slug: string): Promise<InstanceRecord | null>
  setStatus(id: string, status: string): Promise<void>
  setDesiredState(id: string, desiredState: 'RUNNING' | 'STOPPED'): Promise<void>
}
