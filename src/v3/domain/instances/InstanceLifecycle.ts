export const INSTANCE_STATES = [
  'CREATED',
  'STARTING',
  'PAIRING',
  'CONNECTING',
  'CONNECTED',
  'DISCONNECTED',
  'RECONNECTING',
  'STOPPING',
  'STOPPED',
  'CRASHED',
  'DISABLED',
] as const

export type InstanceState = (typeof INSTANCE_STATES)[number]
export type DesiredState = 'RUNNING' | 'STOPPED'

const transitions: Record<InstanceState, readonly InstanceState[]> = {
  CREATED: ['STARTING', 'STOPPED', 'DISABLED'],
  STARTING: ['PAIRING', 'CONNECTING', 'DISCONNECTED', 'CRASHED', 'STOPPING'],
  PAIRING: ['CONNECTING', 'STOPPING', 'DISCONNECTED', 'CRASHED'],
  CONNECTING: ['CONNECTED', 'PAIRING', 'DISCONNECTED', 'RECONNECTING', 'STOPPING', 'CRASHED'],
  CONNECTED: ['DISCONNECTED', 'RECONNECTING', 'STOPPING'],
  DISCONNECTED: ['RECONNECTING', 'STARTING', 'STOPPING', 'STOPPED', 'CRASHED'],
  RECONNECTING: ['CONNECTING', 'PAIRING', 'CONNECTED', 'DISCONNECTED', 'STOPPING', 'CRASHED'],
  STOPPING: ['STOPPED', 'CRASHED'],
  STOPPED: ['STARTING', 'DISABLED'],
  CRASHED: ['STARTING', 'RECONNECTING', 'STOPPING', 'STOPPED'],
  DISABLED: [],
}

export class InvalidInstanceTransitionError extends Error {
  constructor(public readonly from: InstanceState, public readonly to: InstanceState) {
    super(`Invalid instance lifecycle transition: ${from} -> ${to}`)
    this.name = 'InvalidInstanceTransitionError'
  }
}

export function canTransition(from: InstanceState, to: InstanceState): boolean {
  return from === to || transitions[from].includes(to)
}

export function assertTransition(from: InstanceState, to: InstanceState): void {
  if (!canTransition(from, to)) throw new InvalidInstanceTransitionError(from, to)
}

export function isTerminalState(state: InstanceState): boolean {
  return state === 'STOPPED' || state === 'DISABLED'
}
