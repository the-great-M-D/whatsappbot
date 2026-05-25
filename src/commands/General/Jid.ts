import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'jid',
            description: 'Shows the JID of yourself, the group, or tagged users',
            category: 'general',
            aliases: ['id'],
            usage: `${client.config.prefix}jid [@mention]`,
            dm: true,
            baseXp: 0
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        const lines: string[] = []

        lines.push(`👤 *Your JID:*\n\`${M.sender.jid}\``)

        if (M.chat === 'group') {
            lines.push(`\n👥 *Group JID:*\n\`${M.from}\``)
        }

        if (M.mentioned.length) {
            lines.push(`\n🔖 *Tagged JIDs:*`)
            M.mentioned.forEach((jid) => {
                lines.push(`\`${jid}\``)
            })
        }

        if (M.quoted?.sender) {
            lines.push(`\n💬 *Quoted sender JID:*\n\`${M.quoted.sender}\``)
        }

        lines.push(`\n🤖 *Bot JID:*\n\`${this.client.botJid}\``)

        return void M.reply(lines.join('\n'))
    }
}
