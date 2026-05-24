import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'broadcast',
            description: 'Sends msg to all group chats',
            aliases: ['BC', 'announcement', 'bc'],
            category: 'dev',
            usage: `${client.config.prefix}broadcast`,
            modsOnly: true,
            baseXp: 0
        })
    }

    run = async (M: ISimplifiedMessage, { joined }: IParsedArgs): Promise<void> => {
        const term = joined.trim()
        const chats: string[] = Object.keys(this.client.chats).filter((jid) => jid.includes('g.us'))
        for (let i = 0; i < chats.length; i++) {
            const text = `*「 M_D's 🤹 Bot 」* \n 🤹‍♂️ Prefix  : !* \n${term} By *${M.sender.username}*\n 🤹‍♂️ ft the Coding Family 🤹‍♂️`
            await this.client.sendMessage(chats[i], { text })
        }
    }
}
