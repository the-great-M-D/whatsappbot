import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'joke',
            description: 'sends a random joke for you.',
            category: 'fun',
            usage: `${client.config.prefix}joke`,
            baseXp: 30
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        await fetch(`https://v2.jokeapi.dev/joke/Any`)
            .then((r) => r.json())
            .then((response) => {
                // console.log(response);
                const text = `📝 *Catagory:* ${response.data.category}\n\n*🎃 Joke:* ${response.setup}\n\n*💡 Answer:* ${response.delivery}`
                M.reply(text)
            })
            .catch((err) => {
                M.reply(`🔍 Error: ${err}`)
            })
    }
}
