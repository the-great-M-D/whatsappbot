import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'
import yts from 'yt-search'
import { getSong, getLyrics } from 'ultra-lyrics'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'lyrics',
            description: 'Gives you lyrics with song playable on WhatsApp',
            category: 'media',
            aliases: ['ly'],
            usage: `${client.config.prefix}yts [term]`,
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
        const song = await getSong(term)
        if (song.error || !song.data) return void M.reply(`❌ Could Not find any Matching songs: *${term}*`)
        const { error, data } = await getLyrics(song.data)
        if (error || !data) return void M.reply(`❌ Could Not find any Matching Lyrics: *${song.data.title}*`)
        this.client.sock
            .sendMessage(M.from, {
                text: `*Lyrics of: ${term}*\n\n ${data}`,
                contextInfo: {
                    externalAdReply: {
                        title: `${song.data.artist.name} - ${song.data.title}`,
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
    }
}
