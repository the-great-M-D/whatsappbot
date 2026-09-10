import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canTransition, assertTransition, isTerminalState, InvalidInstanceTransitionError, INSTANCE_STATES, type InstanceState } from '../../domain/instances/InstanceLifecycle'

const valid: Array<[InstanceState, InstanceState]> = [
  ['CREATED', 'STARTING'],
  ['STARTING', 'PAIRING'],
  ['STARTING', 'CONNECTING'],
  ['PAIRING', 'CONNECTING'],
  ['CONNECTING', 'CONNECTED'],
  ['CONNECTED', 'DISCONNECTED'],
  ['DISCONNECTED', 'RECONNECTING'],
  ['RECONNECTING', 'CONNECTING'],
  ['STOPPING', 'STOPPED'],
  ['STOPPED', 'STARTING'],
  ['CRASHED', 'STARTING'],
]

const invalid: Array<[InstanceState, InstanceState]> = [
  ['CREATED', 'CONNECTED'],
  ['STARTING', 'CONNECTED'],
  ['CONNECTED', 'STARTING'],
  ['STOPPED', 'CONNECTED'],
  ['DISABLED', 'STARTING'],
  ['STOPPING', 'STARTING'],
]

test('instance lifecycle allows the required happy paths', () => {
  for (const [from, to] of valid) assert.equal(canTransition(from, to), true, `${from} -> ${to}`)
})

test('instance lifecycle rejects illegal jumps', () => {
  for (const [from, to] of invalid) assert.equal(canTransition(from, to), false, `${from} -> ${to}`)
})

test('same-state transitions are no-ops', () => {
  for (const state of INSTANCE_STATES) assert.equal(canTransition(state, state as InstanceState), true)
})

test('assertTransition throws the typed error for illegal jumps', () => {
  assert.throws(() => assertTransition('STARTING', 'CONNECTED'), InvalidInstanceTransitionError)
  assert.doesNotThrow(() => assertTransition('STARTING', 'CONNECTING'))
})

test('terminal states are recognized', () => {
  assert.equal(isTerminalState('STOPPED'), true)
  assert.equal(isTerminalState('DISABLED'), true)
  assert.equal(isTerminalState('CONNECTED'), false)
})
