import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            adminOnly: true,
            command: 'promote',
            description: 'Promotes the mentioned users to admin',
            category: 'moderation',
            usage: `${client.config.prefix}promote [@mention | tag]`,
            baseXp: 10
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        if (!this.client.isBotAdmin(M.groupMetadata?.admins || []))
            return void M.reply(`❌ I need to be an admin to promote members`)
        if (!M.sender.isAdmin)
            return void M.reply(`❌ Only admins can promote members`)
        if (M.quoted?.sender) M.mentioned.push(M.quoted.sender)
        if (!M.mentioned.length) return void M.reply(`Please tag the users you want to promote`)

        for (const user of M.mentioned) {
            const usr = this.client.contacts[user]
            const username = usr?.notify || usr?.vname || usr?.name || user.split('@')[0]
            if (M.groupMetadata?.admins?.includes(user)) {
                await M.reply(`❌ Skipped *${username}* — already an admin`)
            } else {
                await this.client.groupMakeAdmin(M.from, [user]).catch(() => null)
                await M.reply(`👑 Promoted *${username}*`)
            }
        }
    }
}
