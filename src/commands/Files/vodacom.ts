import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, { command: 'vodacom', description: 'sends an HC file for Vodacom.', category: 'files', usage: `${client.config.prefix}vodacom`, baseXp: 30 })
    }
    run = async (M: ISimplifiedMessage): Promise<void> => void M.reply('Vodacom is currently unavailable.').catch((reason: Error) => M.reply(`an error occurred, Reason: ${reason}`))
}
