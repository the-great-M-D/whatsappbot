import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'
import yts from 'yt-search'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'ytsearch',
            description: 'Searches YouTube and returns top results',
            category: 'media',
            aliases: ['yts'],
            usage: `${client.config.prefix}ytsearch [search term]`,
            baseXp: 20
        })
    }

    run = async (M: ISimplifiedMessage, { joined }: IParsedArgs): Promise<void> => {
        if (!joined) return void M.reply('🔎 Provide a search term')
        const term = joined.trim()

        await M.reply(`🔎 Searching YouTube for *${term}*...`)

        let videos: yts.VideoSearchResult[] = []
        try {
            const result = await yts(term)
            videos = result.videos
        } catch {
            return void M.reply('❌ YouTube search failed — try again in a moment')
        }

        if (!videos.length) return void M.reply(`No results found for *${term}*`)

        const top = videos.slice(0, 8)
        let text = `🔎 *YouTube Results for "${term}"*\n\n`
        for (let i = 0; i < top.length; i++) {
            const v = top[i]
            text += `*${i + 1}.* ${v.title}\n`
            text += `   👤 ${v.author.name}  ⏱ ${v.duration.timestamp}\n`
            text += `   🔗 ${v.url}\n\n`
        }
        text += `_Use !ytaudio or !ytvideo with a URL to download_`

        await this.client.sock
            .sendMessage(M.from, {
                text,
                contextInfo: {
                    externalAdReply: {
                        title: top[0].title.slice(0, 60),
                        body: `${top[0].author.name} • ${top[0].duration.timestamp}`,
                        mediaType: 2,
                        thumbnailUrl: top[0].thumbnail,
                        mediaUrl: top[0].url,
                        sourceUrl: top[0].url
                    }
                }
            }, { quoted: M.WAMessage })
            .catch(() => M.reply(text))
    }
}
