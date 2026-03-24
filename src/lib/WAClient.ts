import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

import P from 'pino'
import EventEmitter from 'events'
import fs from 'fs'

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

        const { version } = await fetchLatestBaileysVersion()

        this.sock = makeWASocket({
            version,
            logger: P({ level: 'silent' }),
            auth: state
        })

        this.sock.ev.on('creds.update', saveCreds)

        this.sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
            if (qr) {
                this.emit('qr', qr)
            }

            if (connection === 'open') {
                this.user = this.sock.user
                this.emit('open')
            }

            if (connection === 'close') {
                const shouldReconnect =
                    lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

                if (shouldReconnect) this.connect()
            }
        })

        // 🔥 MESSAGE BRIDGE
        this.sock.ev.on('messages.upsert', ({ messages }) => {
            const msg = messages[0]
            if (!msg.message) return

            this.emit('new-message', msg)
        })

        // 🔥 GROUP EVENTS
        this.sock.ev.on('group-participants.update', (data) => {
            this.emit('group-participants-update', data)
        })

        // 🔥 CALL EVENTS (limited support now)
        this.sock.ws.on('CB:call', (json: any) => {
            this.emit('CB:Call', json)
        })
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