export type InstanceState =
    | 'CREATED'
    | 'STARTING'
    | 'PAIRING'
    | 'CONNECTING'
    | 'CONNECTED'
    | 'DISCONNECTED'
    | 'RECONNECTING'
    | 'STOPPING'
    | 'STOPPED'
    | 'CRASHED'
    | 'DISABLED'

export type DesiredState = 'RUNNING' | 'STOPPED'

const transitions: Record<InstanceState, InstanceState[]> = {
    CREATED: ['STARTING', 'DISABLED'],
    STARTING: ['PAIRING', 'CONNECTING', 'CRASHED', 'STOPPING'],
    PAIRING: ['CONNECTING', 'STOPPING', 'CRASHED'],
    CONNECTING: ['CONNECTED', 'PAIRING', 'DISCONNECTED', 'CRASHED', 'STOPPING'],
    CONNECTED: ['DISCONNECTED', 'STOPPING', 'CRASHED'],
    DISCONNECTED: ['RECONNECTING', 'PAIRING', 'STOPPING', 'CRASHED'],
    RECONNECTING: ['CONNECTING', 'PAIRING', 'DISCONNECTED', 'CRASHED', 'STOPPING'],
    STOPPING: ['STOPPED', 'CRASHED'],
    STOPPED: ['STARTING', 'DISABLED'],
    CRASHED: ['STARTING', 'STOPPED', 'DISABLED'],
    DISABLED: ['STARTING', 'STOPPED'],
}

export function canTransition(from: InstanceState, to: InstanceState): boolean {
    return from === to || transitions[from].includes(to)
}

export function assertTransition(from: InstanceState, to: InstanceState): void {
    if (!canTransition(from, to)) throw new Error(`Invalid instance transition: ${from} -> ${to}`)
}
