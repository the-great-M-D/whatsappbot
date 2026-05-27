import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'
import yts from 'yt-search'
import YT from '../../lib/YT'

const MAX_DURATION = 60 * 10

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'play',
            description: 'Search and download a song by name',
            category: 'media',
            aliases: ['music'],
            usage: `${client.config.prefix}play [song name]`,
            baseXp: 30
        })
    }

    run = async (M: ISimplifiedMessage, { joined }: IParsedArgs): Promise<void> => {
        if (!joined) return void M.reply('🔎 Provide a song name or search term')
        const term = joined.trim()

        await M.reply(`🔎 Searching for *${term}*...`)

        let videos: yts.VideoSearchResult[] = []
        try {
            const result = await yts(term)
            videos = result.videos
        } catch {
            return void M.reply('❌ Search failed — try again in a moment')
        }

        if (!videos.length) return void M.reply(`❌ No results found for *${term}*`)

        const video = videos[0]
        const yt = new YT(video.url, 'audio')

        if (video.duration.seconds > MAX_DURATION)
            return void M.reply(
                `❌ Track is too long (${video.duration.timestamp}). Max is 10 minutes.\n\nTry a more specific search term.`
            )

        await M.reply(
            `🎵 *${video.title}*\n👤 ${video.author.name}\n⏱ ${video.duration.timestamp}\n\n⏳ Downloading...`
        )

        try {
            const buffer = await yt.getBuffer()
            await this.client.sock.sendMessage(M.from, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                contextInfo: {
                    externalAdReply: {
                        title: video.title.slice(0, 60),
                        body: `${video.author.name} • via Kaoi Bot`,
                        mediaType: 2,
                        thumbnailUrl: video.thumbnail,
                        mediaUrl: video.url,
                        sourceUrl: video.url
                    }
                }
            }, { quoted: M.WAMessage })
        } catch (err: any) {
            await M.reply(`❌ Download failed: ${err?.message || 'Unknown error'}`)
        }
    }
}
