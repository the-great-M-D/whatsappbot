import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            adminOnly: true,
            command: 'close',
            description: 'Closes the group so only admins can send messages',
            category: 'moderation',
            usage: `${client.config.prefix}close`,
            baseXp: 0
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        if (!this.client.isBotAdmin(M.groupMetadata?.admins || []))
            return void M.reply("I can't close the group without being an admin")
        if (!M.sender.isAdmin)
            return void M.reply("Only admins can close the group")
        if (M.groupMetadata.announce) return void M.reply('Group is already closed')
        await this.client.groupSettingChange(M.from, 'announce').catch(() => null)
        await M.reply('🔒 Group closed — only admins can send messages')
    }
}
