import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CommandRegistry, type CommandDefinition } from '../../domain/commands/CommandRegistry'

const definition = (name: string, overrides: Partial<CommandDefinition> = {}): CommandDefinition => ({
  name,
  run: () => ({ type: 'no-response' as const }),
  ...overrides,
})

test('registry registers and resolves commands case-insensitively', () => {
  const registry = new CommandRegistry()
  registry.register(definition('Ping', { aliases: ['p'] }))
  assert.equal(registry.resolve('ping')?.name, 'ping')
  assert.equal(registry.resolve('  PING ')?.name, 'ping')
})

test('registry rejects empty and duplicate names', () => {
  const registry = new CommandRegistry()
  registry.register(definition('ping'))
  assert.throws(() => registry.register(definition('ping')), /already registered/)
  assert.throws(() => registry.register(definition('  ')), /name is required/)
})

test('registry resolves aliases to the canonical command', () => {
  const registry = new CommandRegistry()
  registry.register(definition('status', { aliases: [' st ', 'STATE'] }))
  assert.equal(registry.resolve('st')?.name, 'status')
  assert.equal(registry.resolve('state')?.name, 'status')
  assert.equal(registry.resolve('unknown'), undefined)
})

test('registry list exposes registered definitions', () => {
  const registry = new CommandRegistry()
  registry.register(definition('ping'))
  registry.register(definition('stats'))
  assert.deepEqual(registry.list().map((c) => c.name).sort(), ['ping', 'stats'])
})

test('registry clear removes everything', () => {
  const registry = new CommandRegistry()
  registry.register(definition('ping'))
  registry.clear()
  assert.equal(registry.resolve('ping'), undefined)
})

test('commands execute with their context and return results', async () => {
  const registry = new CommandRegistry()
  registry.register(definition('echo', {
    run: (context) => ({ type: 'text' as const, text: `${context.chatType}:${context.args.join(' ')}` })
  }))
  const command = registry.resolve('echo')
  const result = await command?.run({ instanceId: 'i', actorId: 'u', chatId: 'c', chatType: 'group', args: ['a', 'b'], text: 'echo a b' })
  assert.deepEqual(result, { type: 'text', text: 'group:a b' })
})
