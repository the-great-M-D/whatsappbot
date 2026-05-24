import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

import P from 'pino'
import EventEmitter from 'events'

export default class WAClient extends EventEmitter {
    public sock: any
    public user: any = {}
    public config: any

    constructor(config: any) {
        super()
        this.config = config
    }

    log(msg: string, error = false) {
        console.log(error ? '❌' : '✅', msg)
    }

    async connect() {
        const { state, saveCreds } = await useMultiFileAuthState(`auth/${this.config.session}`)

        // fetchLatestBaileysVersion may return different shapes across releases,
        // some versions return an array [version, isLatest], others return an object.
        let version: any = undefined
        try {
            const maybe = await fetchLatestBaileysVersion()
            // handle both { version } and [version, isLatest]
            if (Array.isArray(maybe)) {
                version = maybe[0]
            } else if (maybe && (maybe as any).version) {
                version = (maybe as any).version
            } else {
                version = maybe
            }
        } catch (err) {
            // fallback: leave version undefined to let Baileys use its default
            this.log('Could not fetch latest baileys version, using default', true)
        }

        this.sock = makeWASocket({
            version,
            logger: P({ level: 'silent' }),
            auth: state
        })

        // persist credentials
        if (this.sock?.ev?.on) {
            this.sock.ev.on('creds.update', saveCreds)
        }

        // connection updates
        if (this.sock?.ev?.on) {
            this.sock.ev.on('connection.update', (update: any) => {
                const { connection, lastDisconnect, qr } = update

                if (qr) {
                    this.emit('qr', qr)
                }

                if (connection === 'open' || connection === 'connected') {
                    // some baileys versions use 'open', some use 'connected'
                    this.user = this.sock.user
                    this.emit('open')
                }

                if (connection === 'close' || connection === 'disconnected') {
                    // tolerate different shapes of lastDisconnect
                    const statusCode =
                        lastDisconnect?.error?.output?.statusCode ??
                        lastDisconnect?.error?.statusCode ??
                        lastDisconnect?.statusCode

                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut

                    if (shouldReconnect) {
                        // small delay to avoid tight reconnect loops
                        setTimeout(() => this.connect(), 2000)
                    } else {
                        this.log('Logged out from WhatsApp session', true)
                    }
                }
            })
        }

        // message upserts
        if (this.sock?.ev?.on) {
            this.sock.ev.on('messages.upsert', (m: any) => {
                const messages = m.messages ?? []
                const msg = messages[0]
                if (!msg || !msg.message) return
                this.emit('new-message', msg)
            })
        }

        // group participants updates
        if (this.sock?.ev?.on) {
            this.sock.ev.on('group-participants.update', (data: any) => {
                this.emit('group-participants-update', data)
            })
        }

        // call events: older code used sock.ws.on('CB:call') but newer Baileys may not expose ws.
        // Try both approaches if available.
        try {
            if (this.sock?.ws?.on) {
                this.sock.ws.on('CB:call', (json: any) => {
                    this.emit('CB:Call', json)
                })
            }
        } catch (e) {
            // ignore
        }

        // some versions may emit call events via the event emitter
        try {
            if (this.sock?.ev?.on) {
                this.sock.ev.on('call', (data: any) => {
                    this.emit('CB:Call', data)
                })
            }
        } catch (e) {
            // ignore
        }
    }

    async sendMessage(jid: string, content: any) {
        return this.sock.sendMessage(jid, content)
    }

    async rejectCall(jid: string, id: string) {
        await this.sock.sendMessage(jid, {
            text: "❌ Calls are not allowed"
        })
    }

    async saveAuthInfo(session: string) {
        // no-op (handled by Baileys now)
    }

    async getAuthInfo(session: string) {
        return true
    }

    loadAuthInfo(_: any) {
        // no-op
    }

    async modifyAllChats(type: string) {
        // optional: implement later if needed
        this.log(`modifyAllChats not implemented (${type})`)
    }
}