import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage, IParsedArgs } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            adminOnly: true,
            command: 'add',
            description: 'Adds a participant to the group by number',
            category: 'moderation',
            usage: `${client.config.prefix}add [number]`,
            baseXp: 10
        })
    }

    run = async (M: ISimplifiedMessage, parsedArgs: IParsedArgs): Promise<void> => {
        if (!this.client.isBotAdmin(M.groupMetadata?.admins || []))
            return void M.reply(`❌ Make me admin first before using ${this.config.command}`)
        if (!M.sender.isAdmin)
            return void M.reply(`❌ Only admins can add members`)
        const number = parsedArgs.joined.replace(/\D+/g, '').trim()
        if (!number.length) return void M.reply(`Please provide the number you want to add`)
        try {
            const onWA = await this.client.isOnWhatsApp(`${number}@s.whatsapp.net`)
            if (!onWA) return void M.reply(`❌ That number is not on WhatsApp`)
            const result = await this.client.groupAdd(M.from, [`${number}@s.whatsapp.net`])
            if (!result) return void M.reply(`❌ Failed to add ${number}`)
            await M.reply(`✅ Successfully added *${number}*`)
        } catch {
            M.reply(`❌ Something went wrong`)
        }
    }
}
