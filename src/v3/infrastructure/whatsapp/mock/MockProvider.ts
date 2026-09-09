import type { WhatsAppConnection, WhatsAppMessage, WhatsAppProvider, WhatsAppProviderEvent } from '../../../domain/whatsapp/WhatsAppProvider'

export interface MockProviderOptions {
  instanceId: string
  connectDelayMs?: number
  onEvent: (event: WhatsAppProviderEvent) => void
}

/**
 * In-memory WhatsAppProvider used by the end-to-end test harness and local
 * development. It follows the real provider contract: emits connection state,
 * pairing artifacts and messages, and records outgoing sends.
 */
export class MockProvider implements WhatsAppProvider {
  readonly instanceId: string
  private connection: WhatsAppConnection = { state: 'STOPPED' }
  private readonly listeners = new Set<(event: WhatsAppProviderEvent) => void>()
  readonly outbox: Array<{ chatId: string; text: string; sentAt: number }> = []

  constructor(private readonly options: MockProviderOptions) {
    this.instanceId = options.instanceId
    this.listeners.add(options.onEvent)
  }

  async start(): Promise<void> {
    this.setConnection({ state: 'CONNECTING' })
    await delay(this.options.connectDelayMs ?? 50)
    this.setConnection({ state: 'CONNECTED' })
  }

  async stop(): Promise<void> {
    this.setConnection({ state: 'STOPPED' })
  }

  async pair(method: 'qr' | 'phone', _phoneNumber?: string): Promise<void> {
    this.setConnection({ state: 'PAIRING' })
    if (method === 'qr') this.options.onEvent({ type: 'qr', qr: 'mock-qr-code' })
    else this.options.onEvent({ type: 'pairing-code', code: '123456' })
  }

  async sendText(chatId: string, text: string): Promise<void> {
    this.outbox.push({ chatId, text, sentAt: Date.now() })
    const chatType = chatId.endsWith('@g.us') ? 'group' : 'private'
    this.emit({ type: 'message', message: { id: `mock-out-${this.outbox.length}`, chatId, senderId: chatId, chatType, timestamp: Date.now(), text, isFromMe: true } })
  }

  getConnection(): WhatsAppConnection { return { ...this.connection } }

  onEvent(listener: (event: WhatsAppProviderEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Test hook: simulate an inbound WhatsApp message. */
  mockIncoming(message: Partial<WhatsAppMessage> & Pick<WhatsAppMessage, 'chatId'>): void {
    const full: WhatsAppMessage = {
      id: message.id ?? `mock-in-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      chatId: message.chatId,
      senderId: message.senderId ?? 'tester@s.whatsapp.net',
      chatType: message.chatType ?? 'group',
      timestamp: message.timestamp ?? Date.now(),
      text: message.text,
      isFromMe: message.isFromMe ?? false,
    }
    this.emit({ type: 'message', message: full })
  }

  private emit(event: WhatsAppProviderEvent): void {
    for (const listener of [...this.listeners]) listener(event)
  }

  private setConnection(connection: WhatsAppConnection): void {
    this.connection = { ...connection }
    this.emit({ type: 'connection', state: connection.state })
  }
}

function delay(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)) }
