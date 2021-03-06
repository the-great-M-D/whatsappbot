
import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'md',
            description: 'Displays the info about M-D Bot',
            category: 'bots',
            usage: `${client.config.prefix}md`,
            baseXp: 200
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        return void M.reply(
            `š¤¹ *M_D Bot*š¤¹\n\nš *Description:* The Great M_D WhatsApp Bot \n\nš¤¹ *Prefix:* Use ! \n\nš¤¹ *Example:* !help \n\nš *URL:* https://https://github.com/the-great-M-D \n*š§āš» Group:* https://chat.whatsapp.com/Feu778o8LHhKswRVZXsuvO š¤¹\n`
        ).catch((reason: Error) => M.reply(`an error occurred, Reason: ${reason}`))
    }
}
