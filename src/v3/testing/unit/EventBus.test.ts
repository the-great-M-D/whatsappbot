import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventBus } from '../../domain/events/EventBus'

interface TestEvents {
  ping: { value: number }
  boom: { value: number }
}

test('EventBus delivers typed events to subscribers', async () => {
  const bus = new EventBus<TestEvents>()
  const seen: number[] = []
  bus.on('ping', (event) => { seen.push(event.value) })
  bus.emit('ping', { value: 42 })
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(seen, [42])
})

test('EventBus supports multiple subscribers and unsubscribe', async () => {
  const bus = new EventBus<TestEvents>()
  const seen: string[] = []
  const off = bus.on('ping', () => { seen.push('a') })
  bus.on('ping', () => { seen.push('b') })
  bus.emit('ping', { value: 1 })
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(seen, ['a', 'b'])

  off()
  bus.emit('ping', { value: 2 })
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(seen, ['a', 'b', 'b'])
})

test('EventBus isolates failing subscribers', async () => {
  const bus = new EventBus<TestEvents>()
  const seen: number[] = []
  bus.on('boom', () => { throw new Error('subscriber exploded') })
  bus.on('boom', (event) => { seen.push(event.value) })
  bus.emit('boom', { value: 7 })
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(seen, [7])
})

test('EventBus does not leak handlers after clear', async () => {
  const bus = new EventBus<TestEvents>()
  const seen: number[] = []
  bus.on('ping', (event) => { seen.push(event.value) })
  bus.clear()
  bus.emit('ping', { value: 1 })
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(seen, [])
})

test('EventBus tolerates unsubscribe during dispatch', async () => {
  const bus = new EventBus<TestEvents>()
  const seen: number[] = []
  const off = bus.on('ping', () => { off(); seen.push(1) })
  bus.on('ping', () => { seen.push(2) })
  bus.emit('ping', { value: 0 })
  await new Promise((resolve) => setImmediate(resolve))
  // snapshot iteration: both handlers still run on the emitting dispatch
  assert.deepEqual(seen.sort(), [1, 2])
  bus.emit('ping', { value: 0 })
  await new Promise((resolve) => setImmediate(resolve))
  // 'a' unsubscribed itself during the first dispatch, so only 'b' runs now
  assert.deepEqual(seen.sort(), [1, 2, 2])
})
