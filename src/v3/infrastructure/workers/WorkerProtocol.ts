export const WORKER_PROTOCOL_VERSION = 1

export type WorkerMessageType = 'request' | 'response' | 'event' | 'error' | 'heartbeat'

export interface WorkerEnvelope<T = unknown> {
    id: string
    type: WorkerMessageType
    action: string
    instanceId: string
    timestamp: number
    protocolVersion: number
    payload?: T
}

export function createWorkerEnvelope<T>(
    type: WorkerMessageType,
    action: string,
    instanceId: string,
    payload?: T,
): WorkerEnvelope<T> {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        type,
        action,
        instanceId,
        timestamp: Date.now(),
        protocolVersion: WORKER_PROTOCOL_VERSION,
        payload,
    }
}

export function assertWorkerEnvelope(value: unknown, expectedInstanceId?: string): asserts value is WorkerEnvelope {
    if (!value || typeof value !== 'object') throw new Error('Invalid worker message')
    const message = value as Partial<WorkerEnvelope>
    if (typeof message.id !== 'string' || typeof message.action !== 'string') throw new Error('Invalid worker envelope')
    if (typeof message.instanceId !== 'string') throw new Error('Missing worker instance scope')
    if (message.protocolVersion !== WORKER_PROTOCOL_VERSION) throw new Error('Unsupported worker protocol version')
    if (expectedInstanceId && message.instanceId !== expectedInstanceId) throw new Error('Worker instance scope mismatch')
}
