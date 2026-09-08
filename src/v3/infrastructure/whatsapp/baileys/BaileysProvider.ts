import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'
import P from 'pino'
import { EventEmitter } from 'node:events'
import type { WhatsAppConnection, WhatsAppMessage, WhatsAppProvider, WhatsAppProviderEvent } from '../../../domain/whatsapp/WhatsAppProvider'

export interface BaileysProviderOptions {
  instanceId: string
  sessionDir: string
  browserName?: string
}

export class BaileysProvider extends EventEmitter implements WhatsAppProvider {
  readonly instanceId: string
  private readonly sessionDir: string
  private readonly browserName: string
  private socket: ReturnType<typeof makeWASocket> | null = null
  private connection: WhatsAppConnection = { state: 'STARTING' }
  private stopping = false

  constructor(options: BaileysProviderOptions) {
    super()
    this.instanceId = options.instanceId
    this.sessionDir = options.sessionDir
    this.browserName = options.browserName ?? 'Kaoi V3'
  }

  getConnection(): WhatsAppConnection { return { ...this.connection } }

  onEvent(listener: (event: WhatsAppProviderEvent) => void): () => void {
    this.on('provider-event', listener)
    return () => this.off('provider-event', listener)
  }

  async start(): Promise<void> {
    if (this.socket) return
    this.stopping = false
    const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir)
    const socket = makeWASocket({
      auth: state,
      logger: P({ level: 'silent' }),
      browser: [this.browserName, 'Chrome', '1.0.0'],
      printQRInTerminal: false,
    })
    this.socket = socket
    socket.ev.on('creds.update', saveCreds)
    socket.ev.on('connection.update', (update: any) => this.handleConnection(update))
    socket.ev.on('messages.upsert', ({ messages }: any) => {
      for (const message of messages ?? []) {
        const normalized = this.normalizeMessage(message)
        if (normalized) this.emitProvider({ type: 'message', message: normalized })
      }
    })
  }

  async pair(method: 'qr' | 'phone', phoneNumber?: string): Promise<void> {
    if (method !== 'phone') {
      if (!this.socket) await this.start()
      return
    }
    const phone = (phoneNumber ?? '').replace(/\D/g, '')
    if (!phone) throw new Error('Invalid phone number')
    if (!this.socket) await this.start()
    const socket = this.socket
    if (!socket) throw new Error('WhatsApp socket unavailable')
    const code = await socket.requestPairingCode(phone)
    this.emitProvider({ type: 'pairing-code', code })
  }

  async sendText(chatId: string, text: string): Promise<void> {
    if (!this.socket) throw new Error('WhatsApp is not started')
    await this.socket.sendMessage(chatId, { text })
  }

  async stop(): Promise<void> {
    this.stopping = true
    const socket = this.socket
    this.socket = null
    if (socket) {
      try { socket.end(undefined) } catch { /* socket may already be closed */ }
    }
    this.setConnection('STOPPED')
  }

  private handleConnection(update: any): void {
    if (update.qr) this.emitProvider({ type: 'qr', qr: update.qr })
    if (update.connection === 'open') {
      this.setConnection('CONNECTED')
      return
    }
    if (update.connection === 'connecting') {
      this.setConnection('CONNECTING')
      return
    }
    if (update.connection === 'close') {
      if (this.stopping) { this.setConnection('STOPPED'); return }
      const status = update.lastDisconnect?.error?.output?.statusCode
      const reason = status ? `Disconnected (${status})` : 'Connection closed'
      this.setConnection('DISCONNECTED', reason)
    }
  }

  private setConnection(state: WhatsAppConnection['state'], reason?: string): void {
    this.connection = { state, ...(reason ? { reason } : {}) }
    this.emitProvider({ type: 'connection', state, ...(reason ? { reason } : {}) })
  }

  private emitProvider(event: WhatsAppProviderEvent): void { this.emit('provider-event', event) }

  private normalizeMessage(message: any): WhatsAppMessage | null {
    const chatId = message?.key?.remoteJid
    if (typeof chatId !== 'string') return null
    const chatType: WhatsAppMessage['chatType'] = chatId.endsWith('@g.us') ? 'group' : 'private'
    const content = message?.message
    if (!content) return null
    const text = content.conversation
      ?? content.extendedTextMessage?.text
      ?? content.imageMessage?.caption
      ?? content.videoMessage?.caption
    return {
      id: String(message?.key?.id ?? `${chatId}:${message?.messageTimestamp ?? Date.now()}`),
      chatId,
      senderId: String(message?.key?.participant ?? message?.key?.remoteJid ?? ''),
      chatType,
      timestamp: Number(message?.messageTimestamp ?? Math.floor(Date.now() / 1000)) * 1000,
      ...(typeof text === 'string' ? { text } : {}),
      isFromMe: Boolean(message?.key?.fromMe),
    }
  }
}
