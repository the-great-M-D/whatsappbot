import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            adminOnly: true,
            command: 'open',
            description: 'Opens the group so all participants can send messages',
            category: 'moderation',
            usage: `${client.config.prefix}open`,
            baseXp: 0
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        if (!this.client.isBotAdmin(M.groupMetadata?.admins || []))
            return void M.reply("I can't open the group without being an admin")
        if (!M.sender.isAdmin)
            return void M.reply("Only admins can open the group")
        if (!M.groupMetadata.announce) return void M.reply('Group is already open')
        await this.client.groupSettingChange(M.from, 'not_announce').catch(() => null)
        await M.reply('✅ Group opened — everyone can now send messages')
    }
}
