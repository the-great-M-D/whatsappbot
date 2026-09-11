import makeWASocket, { fetchLatestBaileysVersion, useMultiFileAuthState } from '@whiskeysockets/baileys'
import { mkdirSync, rmSync } from 'node:fs'
import P from 'pino'
import { EventEmitter } from 'node:events'
import type { WhatsAppConnection, WhatsAppMessage, WhatsAppProvider, WhatsAppProviderEvent } from '../../../domain/whatsapp/WhatsAppProvider'

export interface BaileysProviderOptions { instanceId: string; sessionDir: string; browserName?: string; reconnectBaseMs?: number; reconnectMaxMs?: number; onCredentialsSaved?: () => Promise<void> }
const PERMANENT_DISCONNECT_CODES = new Set([401, 403, 411, 440])

export class BaileysProvider extends EventEmitter implements WhatsAppProvider {
  readonly instanceId: string
  private readonly sessionDir: string
  private readonly browserName: string
  private readonly reconnectBaseMs: number
  private readonly reconnectMaxMs: number
  private readonly onCredentialsSaved?: () => Promise<void>
  private socket: ReturnType<typeof makeWASocket> | null = null
  private connection: WhatsAppConnection = { state: 'STARTING' }
  private stopping = false
  private reconnectTimer?: NodeJS.Timeout
  private reconnectAttempt = 0
  private generation = 0
  private cachedVersion?: [number, number, number]
  private pairingPhone?: string
  private codeRequestedGeneration = -1
  private linked = false
  private backupPromise: Promise<void> = Promise.resolve()

  constructor(options: BaileysProviderOptions) { super(); this.instanceId = options.instanceId; this.sessionDir = options.sessionDir; this.browserName = options.browserName ?? 'Kaoi V3'; this.reconnectBaseMs = Math.max(250, options.reconnectBaseMs ?? 1000); this.reconnectMaxMs = Math.max(this.reconnectBaseMs, options.reconnectMaxMs ?? 30000); this.onCredentialsSaved = options.onCredentialsSaved }
  getConnection(): WhatsAppConnection { return { ...this.connection } }
  onEvent(listener: (event: WhatsAppProviderEvent) => void): () => void { this.on('provider-event', listener); return () => this.off('provider-event', listener) }

  async start(): Promise<void> {
    if (this.socket) return
    this.stopping = false
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = undefined }
    const generation = ++this.generation
    const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir)
    if (!this.cachedVersion) { try { this.cachedVersion = (await fetchLatestBaileysVersion()).version } catch { /* fall back to library default */ } }
    const socket = makeWASocket({ auth: state, ...(this.cachedVersion ? { version: this.cachedVersion } : {}), logger: P({ level: 'silent' }), browser: [this.browserName, 'Chrome', '1.0.0'], printQRInTerminal: false })
    this.socket = socket
    socket.ev.on('creds.update', () => {
      void saveCreds().then(() => { if (this.onCredentialsSaved) this.backupPromise = this.backupPromise.then(() => this.onCredentialsSaved!()).catch(() => undefined) }).catch(() => undefined)
    })
    socket.ev.on('connection.update', (update: any) => { if (generation === this.generation) this.handleConnection(update) })
    socket.ev.on('messages.upsert', ({ messages }: any) => { if (generation === this.generation) for (const message of messages ?? []) { const normalized = this.normalizeMessage(message); if (normalized) this.emitProvider({ type: 'message', message: normalized }) } })
  }

  async pair(method: 'qr' | 'phone', phoneNumber?: string): Promise<void> {
    if (method === 'qr') { if (!this.socket) await this.start(); return }
    const phone = (phoneNumber ?? '').replace(/\D/g, '')
    if (!phone) throw new Error('Invalid phone number')
    this.pairingPhone = phone
    this.codeRequestedGeneration = this.generation
    if (!this.socket) await this.start()
    const socket = this.socket
    if (!socket) throw new Error('WhatsApp socket unavailable')
    const code = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for pairing code (30s). Please try again.')), 30000)
      const attempt = async (): Promise<void> => {
        try { resolve(await socket.requestPairingCode(phone)) } catch (error) { reject(error instanceof Error ? error : new Error(String(error))) } finally { clearTimeout(timeout) }
      }
      setTimeout(() => { void attempt() }, 2000)
    })
    this.emitProvider({ type: 'pairing-code', code })
  }
  async sendText(chatId: string, text: string): Promise<void> { if (!this.socket) throw new Error('WhatsApp is not started'); await this.socket.sendMessage(chatId, { text }) }
  async stop(): Promise<void> { this.stopping = true; this.pairingPhone = undefined; ++this.generation; if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = undefined }; const socket = this.socket; this.socket = null; if (socket) try { socket.end(undefined) } catch { /* already closed */ }; await this.backupPromise.catch(() => undefined); this.reconnectAttempt = 0; this.setConnection('STOPPED') }

  private requestPairingCodeFor(phone: string): void {
    const generation = this.generation
    setTimeout(() => {
      const socket = this.socket
      if (generation !== this.generation || !socket || this.pairingPhone !== phone) return
      void socket.requestPairingCode(phone).then((code) => this.emitProvider({ type: 'pairing-code', code })).catch(() => undefined)
    }, 2000)
  }

  private handleConnection(update: any): void {
    if (update.qr) {
      this.setConnection('PAIRING'); this.emitProvider({ type: 'qr', qr: update.qr })
      if (this.pairingPhone && this.codeRequestedGeneration !== this.generation) {
        this.codeRequestedGeneration = this.generation
        this.requestPairingCodeFor(this.pairingPhone)
      }
    }
    if (update.connection === 'open') { this.linked = true; this.pairingPhone = undefined; this.reconnectAttempt = 0; this.setConnection('CONNECTED'); return }
    if (update.connection === 'connecting') { this.setConnection('CONNECTING'); return }
    if (update.connection !== 'close') return
    const status = Number(update.lastDisconnect?.error?.output?.statusCode ?? 0) || undefined
    this.socket = null
    if (this.stopping) return
    if (status && PERMANENT_DISCONNECT_CODES.has(status)) { this.reconnectAttempt = 0; this.setConnection('DISCONNECTED', `Authentication/session ended (${status})`); return }
    this.setConnection('DISCONNECTED', status ? `Connection lost (${status})` : 'Connection closed')
    if (!this.linked) { rmSync(this.sessionDir, { recursive: true, force: true }); mkdirSync(this.sessionDir, { recursive: true }) }
    this.scheduleReconnect()
  }
  private scheduleReconnect(): void { if (this.stopping || this.reconnectTimer) return; const attempt = ++this.reconnectAttempt; const exponential = Math.min(this.reconnectMaxMs, this.reconnectBaseMs * 2 ** Math.min(attempt - 1, 8)); const delay = Math.min(this.reconnectMaxMs, exponential + Math.floor(Math.random() * Math.max(250, exponential * 0.25))); this.reconnectTimer = setTimeout(() => { this.reconnectTimer = undefined; if (!this.stopping && !this.socket) void this.start().catch((e) => { this.setConnection('DISCONNECTED', e instanceof Error ? e.message : String(e)); this.scheduleReconnect() }) }, delay); this.reconnectTimer.unref() }
  private setConnection(state: WhatsAppConnection['state'], reason?: string): void { this.connection = { state, ...(reason ? { reason } : {}) }; this.emitProvider({ type: 'connection', state, ...(reason ? { reason } : {}) }) }
  private emitProvider(event: WhatsAppProviderEvent): void { this.emit('provider-event', event) }
  private normalizeMessage(message: any): WhatsAppMessage | null { const chatId = message?.key?.remoteJid; if (typeof chatId !== 'string') return null; const content = message?.message; if (!content) return null; const text = content.conversation ?? content.extendedTextMessage?.text ?? content.imageMessage?.caption ?? content.videoMessage?.caption; return { id: String(message?.key?.id ?? `${chatId}:${message?.messageTimestamp ?? Date.now()}`), chatId, senderId: String(message?.key?.participant ?? chatId), chatType: chatId.endsWith('@g.us') ? 'group' : 'private', timestamp: Number(message?.messageTimestamp ?? Math.floor(Date.now() / 1000)) * 1000, ...(typeof text === 'string' ? { text } : {}), isFromMe: Boolean(message?.key?.fromMe) } }
}
