import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'
import yts from 'yt-search'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'karaoke',
            description: 'Gives you karaoke song playable on WhatsApp',
            category: 'media',
            aliases: ['sing'],
            usage: `${client.config.prefix}karaoke [term]`,
            baseXp: 20
        })
    }

    run = async (M: ISimplifiedMessage, { joined }: IParsedArgs): Promise<void> => {
        if (!joined) return void M.reply('Please provide a search term')
        const term = joined.trim()
        const { videos } = await yts(term + ' karaoke song')
        if (!videos || videos.length <= 0) return void M.reply(`No Matching videos found for the term *${term}*`)
        const text = `The great M_D 🤹 ft  The Coding Family 🤹‍♂️`

        this.client.sock
            .sendMessage(M.from, {
                text,
                contextInfo: {
                    externalAdReply: {
                        title: `Search Term: ${term}`,
                        body: `🤹 Handcrafted for you by M_D 🤹`,
                        mediaType: 2,
                        thumbnailUrl: videos[0].thumbnail,
                        mediaUrl: videos[0].url,
                        sourceUrl: videos[0].url
                    }
                }
            }, { quoted: M.WAMessage })
            .catch((reason: any) => M.reply(`an error occurred, Reason: ${reason}`))
    }
}
