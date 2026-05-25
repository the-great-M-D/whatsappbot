import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'
import yts from 'yt-search'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'ytsearch',
            description: 'Searches YT',
            category: 'media',
            aliases: ['yts'],
            usage: `${client.config.prefix}yts [term]`,
            baseXp: 20
        })
    }

    run = async (M: ISimplifiedMessage, { joined }: IParsedArgs): Promise<void> => {
        if (!joined) return void M.reply('🔎 Provide a search term')
        const term = joined.trim()
        const { videos } = await yts(term)
        if (!videos || videos.length <= 0) return void M.reply(`🤹 No Matching videos found for : *${term}*`)
        const length = videos.length < 10 ? videos.length : 10
        let text = `🔎 *Results for ${term}*\n`
        for (let i = 0; i < length; i++) {
            text += `*#${i + 1}*\n📗 *Title:* ${videos[i].title}\n📕 *Channel:* ${
                videos[i].author.name
            }\n 📙 *Duration:* ${videos[i].duration}\n📘 *URL:* ${videos[i].url}\n\n`
        }
        M.reply('Please wait... while the Bot is 🤹 searching...')
        this.client.sock
            .sendMessage(M.from, {
                text,
                contextInfo: {
                    externalAdReply: {
                        title: `Search Term: ${term}`,
                        body: `🤹 Handcrafted for you by M_D's Bot 🤹`,
                        mediaType: 2,
                        thumbnailUrl: videos[0].thumbnail,
                        mediaUrl: videos[0].url,
                        sourceUrl: videos[0].url
                    }
                }
            }, { quoted: M.WAMessage })
            .catch((reason: any) => M.reply(`❌ an error occurred, Reason: ${reason}`))
    }
}
