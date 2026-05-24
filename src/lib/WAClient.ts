import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadMediaMessage
} from '@whiskeysockets/baileys'

import P from 'pino'
import EventEmitter from 'events'
import Utils from './Utils'
import DatabaseHandler from '../Handlers/DatabaseHandler'
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
    public state: string = 'close'

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

        this.sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }: any) => {
            if (qr) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const qrImage = require('qr-image')
                    this.QR = qrImage.imageSync(qr, { type: 'png' })
                } catch {
                    this.QR = null
                }
                this.emit('qr', qr)
            }

            if (connection === 'open') {
                this.state = 'open'
                this.user = this.sock.user
                this.emit('open')
            }

            if (connection === 'close') {
                this.state = 'close'
                const shouldReconnect =
                    (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut

                if (shouldReconnect) this.connect()
            }
        })

        this.sock.ev.on('messages.upsert', ({ messages }: any) => {
            const msg = messages[0]
            if (!msg.message) return
            this.emit('new-message', msg)
        })

        this.sock.ev.on('group-participants.update', (data: any) => {
            this.emit('group-participants-update', data)
        })

        if (this.sock.ws) {
            this.sock.ws.on('CB:call', (json: any) => {
                this.emit('CB:Call', json)
            })
        }
    }

    async sendMessage(jid: string, content: any, type?: any, options?: any): Promise<any> {
        if (type === undefined || typeof type === 'object') {
            return this.sock.sendMessage(jid, content)
        }
        // Handle old MessageType-style calls
        const typeStr = String(type)
        if (typeStr === 'text' || typeStr === 'extendedText') {
            return this.sock.sendMessage(jid, {
                text: content,
                ...(options?.contextInfo ? { contextInfo: options.contextInfo } : {})
            })
        }
        if (typeStr === 'image') {
            return this.sock.sendMessage(jid, {
                image: Buffer.isBuffer(content) ? content : Buffer.from(content),
                caption: options?.caption || '',
                ...(options?.contextInfo ? { contextInfo: options.contextInfo } : {})
            })
        }
        if (typeStr === 'video') {
            return this.sock.sendMessage(jid, {
                video: Buffer.isBuffer(content) ? content : Buffer.from(content),
                caption: options?.caption || '',
                ...(options?.contextInfo ? { contextInfo: options.contextInfo } : {})
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
        await this.sendMessage(caller, { text: '❌ Calls are not allowed' })
    }

    generateMessageTag(): string {
        return `${Math.floor(Math.random() * 1000)}.--${Date.now()}`
    }

    async sendWA(payload: string): Promise<void> {
        try {
            if (this.sock?.ws?.send) {
                this.sock.ws.send(payload)
            }
        } catch {
            // ignore
        }
    }

    async saveAuthInfo(session: string): Promise<void> {
        // handled by Baileys useMultiFileAuthState
    }

    async getAuthInfo(session: string): Promise<any> {
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
            const code = await this.sock.groupInviteCode(jid)
            return code
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
        } catch {
            // ignore
        }
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

    async groupSettingChange(jid: string, setting: string, revert = false): Promise<any> {
        try {
            const action = revert ? 'not_announce' : setting
            return await this.sock.groupSettingUpdate(jid, action as any)
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
            return await this.sock.sendMessage(jid, { delete: message.key })
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
        return this.contacts[jid] || { notify: jid.split('@')[0] }
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
