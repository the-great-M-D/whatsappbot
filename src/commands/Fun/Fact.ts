import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'fact',
            description: 'sends a random fact for you.',
            aliases: ['facts'],
            category: 'fun',
            usage: `${client.config.prefix}fact`,
            baseXp: 30
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        await fetch(`https://nekos.life/api/v2/fact`)
            .then((r) => r.json())
            .then((response) => {
                // console.log(response);
                const text = `📝 *Fact:* ${response.fact}`
                M.reply(text)
            })
            .catch((err) => {
                M.reply(`🔍 Error: ${err}`)
            })
    }
}
