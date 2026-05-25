import makeWASocket, {
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    downloadMediaMessage
} from '@whiskeysockets/baileys'
import { backupAuthToDB, restoreAuthFromDB, clearAuthFromDB } from './MongoAuthState'
import { remove as fsRemove } from 'fs-extra'

import P from 'pino'
import EventEmitter from 'events'
import Utils from './Utils'
import DatabaseHandler from '../Handlers/DatabaseHandler'
import { buildSimplifiedMessage } from './Message'
import { IGroupModel, IUserModel } from '../typings'

export const toggleableGroupActions = ['announce', 'not_announce', 'locked', 'unlocked'] as const

export default class WAClient extends EventEmitter {
    public sock: any
    public user: any = {}
    public config: any
    public util = new Utils()
    public assets = new Map<string, Buffer>()
    public DB = new DatabaseHandler()
    public features = new Map<string, boolean>()
    public contacts: Record<string, any> = {}
    public chats: Record<string, any> = {}
    public QR: Buffer | null = null
    public QRText: string | null = null
    public pairCode: string | null = null
    public pairCodePhone: string | null = null
    public state: string = 'close'
    public registered: boolean = false
    private intentionalStop: boolean = false
    private reconnectAttempts: number = 0
    private readonly MAX_RECONNECTS = 5

    constructor(config: any) {
        super()
        this.config = config
    }

    log(msg: string, error = false) {
        console.log(error ? '❌' : '✅', msg)
    }

    private stopSocket() {
        this.intentionalStop = true
        if (this.sock) {
            try { this.sock.end(undefined) } catch { /* ignore */ }
            this.sock = null
        }
        this.state = 'close'
    }

    private async clearAuth() {
        await fsRemove(`auth/${this.config.session}`).catch(() => { /* ignore */ })
        if (this.DB.connected) {
            await clearAuthFromDB(this.DB.session)
        }
    }

    async connectWithPhone(phone: string): Promise<string> {
        const cleaned = phone.replace(/\D/g, '')
        if (!cleaned) throw new Error('Invalid phone number')

        this.stopSocket()
        await this.clearAuth()

        const code = await new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timed out waiting for pairing code (30s). Please try again.')), 30000)
            this.once('pair-code', (c: string) => { clearTimeout(timeout); resolve(c) })
            this.once('pair-error', (e: string) => { clearTimeout(timeout); reject(new Error(e)) })
            this.connect(cleaned)
        })

        return code
    }

    async connect(pairingPhone?: string) {
        this.intentionalStop = false
        const authDir = `auth/${this.config.session}`

        // If DB is connected and local auth files are missing, restore from MongoDB
        if (this.DB.connected) {
            await restoreAuthFromDB(this.DB.session, authDir)
        }

        const { state, saveCreds } = await useMultiFileAuthState(authDir)
        const { version } = await fetchLatestBaileysVersion()
        const isRegistered = !!(state.creds as any).registered

        this.sock = makeWASocket({
            version,
            logger: P({ level: 'silent' }),
            auth: state,
            printQRInTerminal: false
        })

        // Wrap saveCreds to also back up to MongoDB after every credentials update
        const saveAndBackup = async () => {
            await saveCreds()
            if (this.DB.connected) {
                await backupAuthToDB(this.DB.session, authDir)
            }
        }
        this.sock.ev.on('creds.update', saveAndBackup)

        if (pairingPhone && !isRegistered) {
            setTimeout(async () => {
                try {
                    this.log(`Requesting pairing code for +${pairingPhone}...`)
                    const code = await this.sock.requestPairingCode(pairingPhone)
                    this.pairCode = code
                    this.pairCodePhone = pairingPhone
                    this.log(`Pairing code ready: ${code}`)
                    this.emit('pair-code', code)
                } catch (err: any) {
                    this.log(`Failed to get pairing code: ${err.message}`, true)
                    this.emit('pair-error', err.message)
                }
            }, 2000)
        }

        this.sock.ev.on('connection.update', ({ connection, lastDisconnect }: any) => {
            if (connection === 'open') {
                this.state = 'open'
                this.reconnectAttempts = 0
                this.pairCode = null
                this.pairCodePhone = null
                this.user = this.sock.user
                this.log(`Connected as ${this.user?.name || this.user?.id || 'unknown'}`)
                this.emit('open')
            }

            if (connection === 'close') {
                this.state = 'close'
                this.QR = null
                this.QRText = null
                if (this.intentionalStop) {
                    this.intentionalStop = false
                    this.reconnectAttempts = 0
                    return
                }
                const statusCode = (lastDisconnect?.error as any)?.output?.statusCode

                // 401 = logged out, 440 = session replaced by another device
                if (statusCode === 401 || statusCode === 440) {
                    const reason = statusCode === 440
                        ? 'session was replaced by another device'
                        : 'logged out by WhatsApp'
                    this.log(`Disconnected: ${reason}. Clearing credentials and resetting to QR...`, true)
                    this.reconnectAttempts = 0
                    this.clearAuth().then(() => setTimeout(() => this.connect(), 3000))
                    return
                }

                this.reconnectAttempts++
                if (this.reconnectAttempts > this.MAX_RECONNECTS) {
                    this.log(`Too many reconnect attempts (${this.reconnectAttempts}). Clearing credentials and resetting to QR...`, true)
                    this.reconnectAttempts = 0
                    this.clearAuth().then(() => setTimeout(() => this.connect(), 5000))
                    return
                }

                const delay = Math.min(5000 * this.reconnectAttempts, 30000)
                this.log(`Connection closed (${statusCode ?? 'unknown'}), reconnecting in ${delay / 1000}s... (attempt ${this.reconnectAttempts})`)
                setTimeout(() => this.connect(), delay)
            }
        })

        this.sock.ev.on('messages.upsert', async ({ messages }: any) => {
            const msg = messages[0]
            if (!msg?.message) return
            const simplified = await buildSimplifiedMessage(msg, this)
            if (simplified) this.emit('new-message', simplified)
        })

        this.sock.ev.on('group-participants.update', (data: any) => {
            this.emit('group-participants-update', data)
        })

        this.sock.ev.on('contacts.upsert', (contacts: any[]) => {
            for (const contact of contacts) {
                if (contact.id) this.contacts[contact.id] = contact
            }
        })

        this.sock.ev.on('contacts.update', (contacts: any[]) => {
            for (const contact of contacts) {
                if (contact.id) {
                    this.contacts[contact.id] = { ...this.contacts[contact.id], ...contact }
                }
            }
        })

        this.sock.ev.on('chats.upsert', (chats: any[]) => {
            for (const chat of chats) {
                if (chat.id) this.chats[chat.id] = chat
            }
        })

        this.sock.ev.on('chats.update', (chats: any[]) => {
            for (const chat of chats) {
                if (chat.id) this.chats[chat.id] = { ...this.chats[chat.id], ...chat }
            }
        })

        this.sock.ev.on('call', (calls: any[]) => {
            for (const call of calls) {
                this.emit('CB:Call', call)
            }
        })
    }

    async sendMessage(jid: string, content: any, type?: any, options?: any): Promise<any> {
        if (type === undefined || typeof type === 'object') {
            return this.sock.sendMessage(jid, content)
        }
        const typeStr = String(type)
        if (typeStr === 'text' || typeStr === 'extendedText') {
            return this.sock.sendMessage(jid, {
                text: typeof content === 'string' ? content : JSON.stringify(content),
                ...(options?.contextInfo ? { mentions: options.contextInfo.mentionedJid || [] } : {})
            })
        }
        if (typeStr === 'image') {
            return this.sock.sendMessage(jid, {
                image: Buffer.isBuffer(content) ? content : Buffer.from(content),
                caption: options?.caption || '',
                ...(options?.contextInfo ? { mentions: options.contextInfo.mentionedJid || [] } : {})
            })
        }
        if (typeStr === 'video') {
            return this.sock.sendMessage(jid, {
                video: Buffer.isBuffer(content) ? content : Buffer.from(content),
                caption: options?.caption || '',
                ...(options?.contextInfo ? { mentions: options.contextInfo.mentionedJid || [] } : {})
            })
        }
        if (typeStr === 'audio') {
            return this.sock.sendMessage(jid, {
                audio: Buffer.isBuffer(content) ? content : Buffer.from(content),
                mimetype: options?.mimetype || 'audio/mp4'
            })
        }
        if (typeStr === 'sticker') {
            return this.sock.sendMessage(jid, {
                sticker: Buffer.isBuffer(content) ? content : Buffer.from(content)
            })
        }
        if (typeStr === 'document') {
            return this.sock.sendMessage(jid, {
                document: Buffer.isBuffer(content) ? content : Buffer.from(content),
                mimetype: options?.mimetype || 'application/octet-stream',
                fileName: options?.filename || 'file'
            })
        }
        return this.sock.sendMessage(jid, { text: String(content) })
    }

    async rejectCall(caller: string, callID: string): Promise<void> {
        try {
            await this.sock.rejectCall(callID, caller)
        } catch { /* ignore */ }
        await this.sendMessage(caller, { text: '❌ Calls are not allowed' })
    }

    generateMessageTag(): string {
        return `${Math.floor(Math.random() * 1000)}.--${Date.now()}`
    }

    async saveAuthInfo(_session: string): Promise<void> {
        // handled by Baileys useMultiFileAuthState
    }

    async getAuthInfo(_session: string): Promise<any> {
        return true
    }

    loadAuthInfo(_: any): void {
        // no-op
    }

    async modifyAllChats(type: string): Promise<void> {
        this.log(`modifyAllChats not implemented (${type})`)
    }

    async fetchGroupMetadataFromWA(jid: string): Promise<any> {
        try {
            return await this.sock.groupMetadata(jid)
        } catch {
            return null
        }
    }

    async getProfilePicture(jid: string): Promise<string | null> {
        try {
            return await this.sock.profilePictureUrl(jid, 'image')
        } catch {
            return null
        }
    }

    async groupInviteCode(jid: string): Promise<string | null> {
        try {
            return await this.sock.groupInviteCode(jid)
        } catch {
            return null
        }
    }

    async groupRemove(jid: string, participants: string[]): Promise<any> {
        try {
            return await this.sock.groupParticipantsUpdate(jid, participants, 'remove')
        } catch {
            return null
        }
    }

    async groupAdd(jid: string, participants: string[]): Promise<any> {
        try {
            return await this.sock.groupParticipantsUpdate(jid, participants, 'add')
        } catch {
            return null
        }
    }

    async groupMakeAdmin(jid: string, participants: string[]): Promise<any> {
        try {
            return await this.sock.groupParticipantsUpdate(jid, participants, 'promote')
        } catch {
            return null
        }
    }

    async groupDemoteAdmin(jid: string, participants: string[]): Promise<any> {
        try {
            return await this.sock.groupParticipantsUpdate(jid, participants, 'demote')
        } catch {
            return null
        }
    }

    async groupLeave(jid: string): Promise<void> {
        try {
            await this.sock.groupLeave(jid)
        } catch { /* ignore */ }
    }

    async acceptInvite(code: string): Promise<any> {
        try {
            return await this.sock.groupAcceptInvite(code)
        } catch {
            return null
        }
    }

    async revokeInvite(jid: string): Promise<any> {
        try {
            return await this.sock.groupRevokeInvite(jid)
        } catch {
            return null
        }
    }

    async groupSettingChange(jid: string, setting: string): Promise<any> {
        try {
            return await this.sock.groupSettingUpdate(jid, setting as any)
        } catch {
            return null
        }
    }

    async groupUpdateSubject(jid: string, subject: string): Promise<any> {
        try {
            return await this.sock.groupUpdateSubject(jid, subject)
        } catch {
            return null
        }
    }

    async groupUpdateDescription(jid: string, description: string): Promise<any> {
        try {
            return await this.sock.groupUpdateDescription(jid, description)
        } catch {
            return null
        }
    }

    async deleteMessage(jid: string, message: any): Promise<any> {
        try {
            return await this.sock.sendMessage(jid, { delete: message.key || message })
        } catch {
            return null
        }
    }

    async downloadMediaMessage(message: any): Promise<Buffer> {
        return downloadMediaMessage(message, 'buffer', {}) as Promise<Buffer>
    }

    async isOnWhatsApp(jid: string): Promise<boolean> {
        try {
            const result = await this.sock.onWhatsApp(jid)
            return result?.[0]?.exists || false
        } catch {
            return false
        }
    }

    async getStatus(jid: string): Promise<string | null> {
        try {
            const result = await this.sock.fetchStatus(jid)
            return result?.status || null
        } catch {
            return null
        }
    }

    getContact(jid: string): any {
        return this.contacts[jid] || { notify: jid.split('@')[0], id: jid }
    }

    async fetch(url: string): Promise<any> {
        const { default: axios } = await import('axios')
        return axios.get(url)
    }

    async getBuffer(url: string): Promise<Buffer> {
        const { default: axios } = await import('axios')
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        return Buffer.from(response.data)
    }

    async banUser(jid: string): Promise<any> {
        let user = await this.DB.user.findOne({ jid })
        if (!user) user = await this.DB.user.create({ jid })
        user.ban = true
        return user.save()
    }

    async unbanUser(jid: string): Promise<any> {
        const user = await this.DB.user.findOne({ jid })
        if (!user) return null
        user.ban = false
        return user.save()
    }

    async getGroupData(jid: string): Promise<IGroupModel> {
        let group = await this.DB.group.findOne({ jid })
        if (!group) group = await this.DB.group.create({ jid })
        return group
    }

    async getUser(jid: string): Promise<IUserModel> {
        let user = await this.DB.user.findOne({ jid })
        if (!user) user = await this.DB.user.create({ jid })
        return user
    }

    async setXp(jid: string, xp: number, limit: number): Promise<void> {
        const user = await this.getUser(jid)
        user.Xp = Math.min((user.Xp || 0) + xp, limit * 100)
        await user.save()
    }

    isFeature(name: string): boolean {
        return this.features.get(name) ?? false
    }

    async getFeatures(name: string): Promise<boolean> {
        const feature = await this.DB.feature.findOne({ feature: name })
        return feature?.state ?? false
    }

    async setFeatures(): Promise<void> {
        try {
            const features = await this.DB.feature.find()
            for (const feature of features) {
                this.features.set(feature.feature, feature.state)
            }
        } catch (err: any) {
            this.log(`Features could not be loaded from database: ${err.message}`, true)
        }
    }
}
