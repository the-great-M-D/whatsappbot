
import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import { F } from '../../lib/Formatter'
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
            F.frame('About', [
            F.field('Description', 'The Great M_D WhatsApp Bot'),
            F.field('Prefix', this.client.config.prefix),
            F.field('Example', this.client.config.prefix + 'help'),
            F.field('Repo', 'https://github.com/the-great-M-D')
        ], 'M_D Bot 🤹')
        ).catch((reason: Error) => M.reply(F.err(reason.message)))
    }
}
