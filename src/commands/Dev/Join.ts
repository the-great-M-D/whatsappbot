import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'join',
            description: 'Bot joins a group via invite link',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}join [whatsapp invite link]`,
            modsOnly: true,
            baseXp: 50
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        if (!M.urls.length) return void M.reply('Please send a WhatsApp invite link')
        const url = M.urls.find((url) => url.includes('chat.whatsapp.com'))
        if (!url) return void M.reply('No WhatsApp invite URL found in your message')

        const knownGroups = new Set(
            Object.values(this.client.chats)
                .filter((c: any) => c?.id?.endsWith('g.us') || c?.jid?.endsWith('g.us'))
                .map((c: any) => c.id || c.jid)
        )

        const s = url.split('/')
        const inviteCode = s[s.length - 1]
        const result: any = await this.client.acceptInvite(inviteCode).catch(() => ({ status: 401 }))
        if (result?.status === 401) return void M.reply('Cannot join — I may have been removed from that group before')
        const gid = result?.gid || result?.id
        if (gid && knownGroups.has(gid)) return void M.reply('Already in that group')
        if (gid) {
            const meta = await this.client.fetchGroupMetadataFromWA(gid).catch(() => null)
            return void M.reply(`✅ Joined *${meta?.subject || gid}*`)
        }
        return void M.reply('✅ Joined successfully')
    }
}
