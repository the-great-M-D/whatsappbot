import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'
import yts from 'yt-search'
import YT from '../../lib/YT'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'play',
            description: '🎵 play a song with just search term!',
            category: 'media',
            aliases: ['music'],
            usage: `${client.config.prefix}play [term]`,
            baseXp: 30
        })
    }

    run = async (M: ISimplifiedMessage, { joined }: IParsedArgs): Promise<void> => {
        if (!joined) return void M.reply('🔎 Provide a search term')
        const term = joined.trim()
        const { videos } = await yts(term)
        if (!videos || videos.length <= 0) return void M.reply(`⚓ No Matching videos found for the term : *${term}*`)
        const audio = new YT(videos[0].url, 'audio')
        if (!audio.url) return
        M.reply('🤹 Please while wait... while your track is being sent 🤹‍♂️...')
        this.client.sock
            .sendMessage(M.from, {
                audio: await audio.getBuffer(),
                mimetype: 'audio/mp4',
                contextInfo: {
                    externalAdReply: {
                        title: videos[0].title.substr(0, 30),
                        body: `author : ${videos[0].author.name.substr(0, 20)}\nSent Via : M_D Bot's 🤹`,
                        mediaType: 2,
                        thumbnailUrl: `https://i.ytimg.com/vi/${audio.id}/hqdefault.jpg`,
                        mediaUrl: audio.url,
                        sourceUrl: audio.url
                    }
                }
            }, { quoted: M.WAMessage })
            .catch((reason: Error) => M.reply(`❌ an error occurred, Reason: ${reason}`))
    }
}
