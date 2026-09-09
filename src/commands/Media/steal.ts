/*eslint-disable @typescript-eslint/no-explicit-any */
import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'steal', aliases: ['take'], description: 'Reformats a sticker', category: 'media', usage: `${client.config.prefix}steal | pack | author`, baseXp: 30,
        })
    }

    exe() { throw new Error('Method not implemented.') }

    run = async (M: ISimplifiedMessage, _parsedArgs: IParsedArgs): Promise<void> => {
        if (!M.quoted?.message?.message?.stickerMessage) return void M.reply('Provide a sticker to format.')
        return void M.reply('Sticker reformatting is temporarily unavailable.')
    }
}
