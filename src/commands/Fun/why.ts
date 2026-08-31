import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'why',
            description: 'Asks you a *why* question.',
            category: 'fun',
            usage: `${client.config.prefix}why`,
            baseXp: 10
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        await fetch(`https://nekos.life/api/v2/why`)
            .then((r) => r.json())
            .then((response) => {
                // console.log(response);
                const text = `📝 *Question:* ${response.why}`
                M.reply(text)
            })
            .catch((err) => {
                M.reply(`🔍 Error: ${err}`)
            })
    }
}
