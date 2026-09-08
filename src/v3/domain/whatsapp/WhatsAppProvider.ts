export interface WhatsAppMessage {
  id: string
  chatId: string
  senderId: string
  chatType: 'private' | 'group'
  timestamp: number
  text?: string
  isFromMe: boolean
}

export type WhatsAppProviderEvent =
  | { type: 'qr'; qr: string }
  | { type: 'pairing-code'; code: string }
  | { type: 'connection'; state: WhatsAppConnection['state']; reason?: string }
  | { type: 'message'; message: WhatsAppMessage }
  | { type: 'credentials-updated' }
  | { type: 'logged-out'; reason?: string }
  | { type: 'error'; message: string }

export interface WhatsAppConnection {
  state: 'STARTING' | 'PAIRING' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'STOPPED'
  reason?: string
}

export interface WhatsAppProvider {
  readonly instanceId: string
  start(): Promise<void>
  stop(): Promise<void>
  pair(method: 'qr' | 'phone', phoneNumber?: string): Promise<void>
  sendText(chatId: string, text: string): Promise<void>
  getConnection(): WhatsAppConnection
  onEvent(listener: (event: WhatsAppProviderEvent) => void): () => void
}
