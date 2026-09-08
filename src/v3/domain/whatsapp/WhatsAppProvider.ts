export interface WhatsAppMessage {
    id: string
    chatId: string
    senderId: string
    chatType: 'private' | 'group'
    timestamp: number
    text?: string
    isFromMe: boolean
}

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
}
