import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'chat',
            description: 'Chat with the Bot in group',
            aliases: ['bot'],
            category: 'fun',
            usage: `${client.config.prefix}bot (text)`,
            baseXp: 30
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        if (this.client.config.chatBotUrl) {
            const myUrl = new URL(this.client.config.chatBotUrl)
            const params = myUrl.searchParams
            await fetch(
                    `${encodeURI(
                        `http://api.brainshop.ai/get?bid=${params.get('bid')}&key=${params.get('key')}&uid=${
                            M.from
                        }&msg=${M.args.slice(1)}`
                    )}`
                )
                .then(async (res) => {
                    if (!res.ok) return void M.reply(`🔍 Error: ${res.status}`)
                    const data = await res.json()
                    return void M.reply(data.cnt)
                })
                .catch(() => {
                    M.reply(`use !chat then say something to the Bot here 😌`)
                })
        } else {
            M.reply(`Chat Bot Url not set\nRefer to ${this.client.config.prefix}guide to get Chat Bot Url`)
        }
    }
}
