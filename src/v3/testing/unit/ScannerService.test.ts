import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ScannerService, type ScannerConfig } from '../../application/scanner/ScannerService'
import { EventBus, type DomainEventMap } from '../../domain/events/EventBus'
import type { WhatsAppMessage } from '../../domain/whatsapp/WhatsAppProvider'

const settle = () => new Promise((resolve) => setImmediate(resolve))

class FakeStore {
  config: ScannerConfig = { enabled: false, keywords: [] }
  matches: Array<{ instanceId: string; message: WhatsAppMessage; keyword: string }> = []

  async getConfig(): Promise<ScannerConfig> { return { ...this.config } }
  async setConfig(_instanceId: string, config: ScannerConfig): Promise<ScannerConfig> {
    this.config = config
    return { ...config }
  }
  async listMatches(): Promise<Record<string, unknown>[]> { return this.matches.map((m) => ({ keyword: m.keyword })) }
  async recordMatch(instanceId: string, message: WhatsAppMessage, keyword: string): Promise<string> {
    this.matches.push({ instanceId, message, keyword })
    return `event-${this.matches.length}`
  }
}

const groupMessage = (text: string): WhatsAppMessage => ({
  id: 'm1', chatId: 'g@us', senderId: 'user', chatType: 'group', timestamp: Date.now(), text, isFromMe: false,
})

test('scanner setConfig normalizes keywords (trim, dedupe, cap, drop empties)', async () => {
  const store = new FakeStore()
  const scanner = new ScannerService(store as never)
  const config = await scanner.setConfig('i', {
    enabled: true,
    keywords: [' urgent ', 'URGENT', '', 'stock drop', ...Array.from({ length: 105 }, (_, i) => `kw${i}`)],
  })
  assert.equal(config.keywords[0], 'urgent')
  assert.equal(config.keywords.includes('urgent', 1), false, 'duplicates removed')
  assert.equal(config.keywords.length, 100, 'capped at 100')
  assert.equal(config.keywords.includes(''), false)
})

test('scanner records keyword matches and emits ScannerMatch', async () => {
  const store = new FakeStore()
  store.config = { enabled: true, keywords: ['urgent'] }
  const bus = new EventBus<DomainEventMap>()
  const events: string[] = []
  bus.on('ScannerMatch', (event) => { events.push(event.matchedText) })
  new ScannerService(store as never, bus)

  bus.emit('MessageReceived', { instanceId: 'i', messageId: 'm1', chatId: 'g@us', senderId: 'u', chatType: 'group', timestamp: Date.now(), text: 'URGENT: all hands', isFromMe: false })
  await settle()
  await settle()
  assert.equal(store.matches.length, 1)
  assert.deepEqual(events, ['urgent'])
  assert.equal(store.matches[0].message.chatType, 'group')
})

test('scanner never persists private messages or own outbound', async () => {
  const store = new FakeStore()
  store.config = { enabled: true, keywords: ['urgent'] }
  const bus = new EventBus<DomainEventMap>()
  new ScannerService(store as never, bus)

  bus.emit('MessageReceived', { instanceId: 'i', messageId: 'm2', chatId: 'user@s', senderId: 'user', chatType: 'private', timestamp: Date.now(), text: 'urgent secret', isFromMe: false })
  bus.emit('MessageReceived', { instanceId: 'i', messageId: 'm3', chatId: 'g@us', senderId: 'me', chatType: 'group', timestamp: Date.now(), text: 'urgent from me', isFromMe: true })
  await settle()
  await settle()
  assert.equal(store.matches.length, 0)
})

test('scanner honors case sensitivity', async () => {
  const store = new FakeStore()
  const bus = new EventBus<DomainEventMap>()
  new ScannerService(store as never, bus)
  await store.setConfig('i', { enabled: true, keywords: ['URGENT'], caseSensitive: true })

  bus.emit('MessageReceived', { instanceId: 'i', messageId: 'm4', chatId: 'g@us', senderId: 'u', chatType: 'group', timestamp: Date.now(), text: 'this is urgent news', isFromMe: false })
  await settle()
  await settle()
  assert.equal(store.matches.length, 0, 'lowercase urgent must not match case-sensitive URGENT')

  bus.emit('MessageReceived', { instanceId: 'i', messageId: 'm5', chatId: 'g@us', senderId: 'u', chatType: 'group', timestamp: Date.now(), text: 'URGENT news', isFromMe: false })
  await settle()
  await settle()
  assert.equal(store.matches.length, 1)
})

test('scanner ignores non-matching group chatter', async () => {
  const store = new FakeStore()
  store.config = { enabled: true, keywords: ['urgent'] }
  const bus = new EventBus<DomainEventMap>()
  new ScannerService(store as never, bus)
  bus.emit('MessageReceived', { instanceId: 'i', messageId: 'm6', chatId: 'g@us', senderId: 'u', chatType: 'group', timestamp: Date.now(), text: 'just chatting', isFromMe: false })
  await settle()
  await settle()
  assert.equal(store.matches.length, 0)
})

test('scanner skips messages without text', async () => {
  const store = new FakeStore()
  store.config = { enabled: true, keywords: ['urgent'] }
  const bus = new EventBus<DomainEventMap>()
  new ScannerService(store as never, bus)
  const mediaOnly = groupMessage('media sticker')
  delete (mediaOnly as Partial<WhatsAppMessage>).text
  bus.emit('MessageReceived', { instanceId: 'i', messageId: 'm7', chatId: 'g@us', senderId: 'u', chatType: 'group', timestamp: Date.now(), isFromMe: false })
  await settle()
  await settle()
  assert.equal(store.matches.length, 0)
})
