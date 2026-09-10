import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TaskManager } from '../../domain/tasks/TaskManager'

const settle = () => new Promise((resolve) => setImmediate(resolve))

test('TaskManager walks QUEUED -> RUNNING -> SUCCEEDED and captures the result', async () => {
  const transitions: string[] = []
  const tasks = new TaskManager(1, (record) => { transitions.push(record.status) })
  tasks.submit('inst', 'probe', async () => 'done')
  await settle()
  assert.deepEqual(transitions, ['QUEUED', 'RUNNING', 'SUCCEEDED'])
  assert.equal(tasks.list().at(-1)?.result, 'done')
})

test('TaskManager records FAILED with the error message', async () => {
  const tasks = new TaskManager(1)
  const id = tasks.submit('inst', 'probe', async () => { throw new Error('nope') })
  await settle()
  const record = tasks.get(id)
  assert.equal(record?.status, 'FAILED')
  assert.equal(record?.error, 'nope')
})

test('TaskManager timeouts long work and reports TIMED_OUT', async () => {
  const tasks = new TaskManager(1)
  const id = tasks.submit('inst', 'probe', () => new Promise((resolve) => setTimeout(resolve, 500)), { timeoutMs: 10 })
  await new Promise((resolve) => setTimeout(resolve, 50))
  assert.equal(tasks.get(id)?.status, 'TIMED_OUT')
})

test('TaskManager cancels queued tasks but not running ones', async () => {
  const tasks = new TaskManager(1)
  // first task occupies the single slot; second stays queued
  const first = tasks.submit('inst', 'probe', () => new Promise((resolve) => setTimeout(resolve, 20)))
  const second = tasks.submit('inst', 'probe', async () => 'never')
  assert.equal(tasks.get(first)?.status, 'RUNNING', 'first task starts immediately')
  assert.equal(tasks.cancel(second), true, 'queued task is cancellable')
  assert.equal(tasks.get(second)?.status, 'CANCELLED')
  assert.equal(tasks.cancel(first), false, 'running task cannot be cancelled')
  await new Promise((resolve) => setTimeout(resolve, 50))
  assert.equal(tasks.get(first)?.status, 'SUCCEEDED')
})

test('TaskManager respects max concurrency', async () => {
  let running = 0
  let peak = 0
  const tasks = new TaskManager(2)
  const work = () => async () => {
    running++
    peak = Math.max(peak, running)
    await new Promise((resolve) => setTimeout(resolve, 10))
    running--
  }
  for (let i = 0; i < 5; i++) tasks.submit('inst', 'probe', work())
  await new Promise((resolve) => setTimeout(resolve, 100))
  assert.ok(peak <= 2, `peak concurrency ${peak} exceeded limit`)
})

test('TaskManager lists tasks filtered by instance', async () => {
  const tasks = new TaskManager(5)
  tasks.submit('inst-a', 'probe', async () => 1)
  tasks.submit('inst-b', 'probe', async () => 2)
  await settle()
  assert.equal(tasks.list('inst-a').length, 1)
  assert.equal(tasks.list().length, 2)
})

test('TaskManager mints UUID task ids', () => {
  const tasks = new TaskManager(5)
  const id = tasks.submit('inst', 'probe', async () => 1)
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
})
