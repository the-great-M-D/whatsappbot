import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'sticker', aliases: ['s'], description: 'Converts images/videos into stickers', category: 'media', usage: `${client.config.prefix}sticker`, baseXp: 30
        })
    }

    run = async (M: ISimplifiedMessage, _parsedArgs: IParsedArgs): Promise<void> => {
        let buffer: Buffer | undefined
        if (M.quoted?.message?.message?.imageMessage || M.quoted?.message?.message?.videoMessage) buffer = await this.client.downloadMediaMessage(M.quoted.message)
        else if (M.WAMessage.message?.imageMessage || M.WAMessage.message?.videoMessage) buffer = await this.client.downloadMediaMessage(M.WAMessage)
        if (!buffer) return void M.reply(`You didn't provide any Image/Video to convert`)
        // Sticker conversion is intentionally disabled until a maintained converter is added.
        return void M.reply('Sticker conversion is temporarily unavailable.')
    }
}
