import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'
import { Jimp } from 'jimp'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'blur',
            description: 'Blurs the given image or pfp',
            category: 'media',
            usage: `${client.config.prefix}blur [(as caption | quote)[image] | @mention]`,
            baseXp: 30
        })
    }

    run = async (M: ISimplifiedMessage, { joined }: IParsedArgs): Promise<void> => {
        const image = await (M.WAMessage?.message?.imageMessage
            ? this.client.downloadMediaMessage(M.WAMessage)
            : M.quoted?.message?.message?.imageMessage
            ? this.client.downloadMediaMessage(M.quoted.message)
            : M.mentioned[0]
            ? this.client.getProfilePicture(M.mentioned[0])
            : this.client.getProfilePicture(M.quoted?.sender || M.sender.jid))
        if (!image) return void M.reply(`Couldn't fetch the required Image`)
        const level = joined.trim() || '5'
        const blurLevel = isNaN(parseInt(level)) ? 5 : parseInt(level)
        try {
            const img = Buffer.isBuffer(image)
                ? await Jimp.fromBuffer(image as Buffer)
                : await Jimp.read(image as string)
            img.blur(blurLevel)
            const buffer = await (img.getBuffer as (mime: string) => Promise<Buffer>)('image/png')
            M.reply(buffer, 'image')
        } catch (err: any) {
            M.reply(err?.message || `Couldn't blur the image`)
        }
    }
}
