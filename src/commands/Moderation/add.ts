import MessageHandler from '../../Handlers/MessageHandler'

import BaseCommand from '../../lib/BaseCommand'

import WAClient from '../../lib/WAClient'

import { ISimplifiedMessage , IParsedArgs} from '../../typings'

export default class Command extends BaseCommand {

    constructor(client: WAClient, handler: MessageHandler) {

        super(client, handler, {

            

            command: 'add',

            description: 'adds participant to group chats',

            category: 'moderation',

            usage: `${client.config.prefix}add [numbers/ jid]`,

            aliases: ['add'],

            baseXp: 10

        })

    }

    run = async (M: ISimplifiedMessage, parsedArgs: IParsedArgs): Promise<void> => {
        const number = parsedArgs.joined.replace(/\D+/g, '').replace(/\s+/g, '').toString()
        try {
            if (!this.client.isBotAdmin(M.groupMetadata?.admins || []))
                return void M.reply(`❌ Make me admin first before using ${this.config.command}`)
            if (!number.length) return void M.reply(`Please provide the number you want to ${this.config.command}`)
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
