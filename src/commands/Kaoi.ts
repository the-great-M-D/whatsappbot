
import MessageHandler from '../Handlers/MessageHandler'
import BaseCommand from '../lib/BaseCommand'
import WAClient from '../lib/WAClient'
import { ISimplifiedMessage } from '../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'info',
            description: 'Displays the info',
            category: 'bots',
            usage: `${client.config.prefix}info`,
            baseXp: 200
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        return void M.reply(
            `🤹 *M_D*🤹\n\n🍀 *Description:* The Great M_D WhatsApp Bot \n\n🤹 *Prefix:* Use !command-here \n\n🤹 *Example:* !help \n\n🌐 *URL:* https://https://github.com/the-great-M-D \n`
        ).catch((reason: Error) => M.reply(`an error occurred, Reason: ${reason}`))
    }
}
