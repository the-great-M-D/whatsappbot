import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            adminOnly: true,
            aliases: ['boom', 'kick'],
            command: 'remove',
            description: 'Removes the mentioned users from the group',
            category: 'moderation',
            usage: `${client.config.prefix}remove [@mention | tag]`,
            baseXp: 10
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        if (!this.client.isBotAdmin(M.groupMetadata?.admins || []))
            return void M.reply(`❌ I need to be an admin to remove members`)
        if (!M.sender.isAdmin)
            return void M.reply(`❌ Only admins can remove members`)
        if (M.quoted?.sender) M.mentioned.push(M.quoted.sender)
        if (!M.mentioned.length) return void M.reply(`Please tag the users you want to remove`)

        let text = '*Removal Report*\n\n'
        const owner = M.groupMetadata?.owner?.split('@')[0]

        for (const user of M.mentioned) {
            const shortId = user.split('@')[0]
            if (owner && shortId === owner) {
                text += `❌ Skipped *@${shortId}* — group owner\n`
            } else if (this.client.isBotAdmin([user])) {
                text += `❌ Skipped *@${shortId}* — that's me\n`
            } else {
                await this.client.groupRemove(M.from, [user]).catch(() => null)
                text += `🟥 Removed *@${shortId}*\n`
            }
        }

        await M.reply(text, undefined, undefined, [...M.mentioned, M.sender.jid])
    }
}
