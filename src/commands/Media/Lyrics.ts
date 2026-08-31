import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'
import yts from 'yt-search'
// @ts-ignore
import Lyrics from 'lyrics-monarch-api'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'lyrics',
            description: 'Gives you lyrics with song playable on WhatsApp',
            category: 'media',
            aliases: ['ly'],
            usage: `${client.config.prefix}lyrics [term]`,
            dm: true,
            baseXp: 20
        })
    }

    run = async (M: ISimplifiedMessage, { joined }: IParsedArgs): Promise<void> => {
        if (!joined) return void M.reply('🔎 Provide a search term')
        const term = joined.trim()
        const { videos } = await yts(term + ' lyrics song')
        if (!videos || videos.length <= 0) return void M.reply(`🤹‍♂️ No Matching videos found for the term *${term}*`)

        const video = videos[0]
        const lyricsApi = new Lyrics()
        try {
            const response = await lyricsApi.getLyrics(term)
            if (!response || !response.data) return void M.reply(`❌ Could Not find any Matching Lyrics: *${term}*`)
            const lyricsText = typeof response.data === 'string' ? response.data : (response.data.lyrics || JSON.stringify(response.data))

            this.client.sock
                .sendMessage(M.from, {
                    text: `*Lyrics of: ${term}*\n\n ${lyricsText}`,
                    contextInfo: {
                        externalAdReply: {
                            title: `Lyrics: ${term}`,
                            body: video.url,
                            mediaType: 2,
                            thumbnailUrl: video.thumbnail,
                            mediaUrl: video.url,
                            sourceUrl: video.url
                        },
                        mentionedJid: [M.sender.jid]
                    }
                })
                .catch((reason: Error) => M.reply(`❌ an error occurred, Reason: ${reason}`))
        } catch {
            M.reply(`❌ Could Not find any Matching Lyrics: *${term}*`)
        }
    }
}
