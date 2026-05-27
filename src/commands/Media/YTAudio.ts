import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import YT from '../../lib/YT'
import { ISimplifiedMessage } from '../../typings'

const MAX_DURATION_AUDIO = 60 * 15

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'ytaudio',
            description: 'Downloads a YouTube video and sends it as audio (MP3)',
            category: 'media',
            aliases: ['yta'],
            usage: `${client.config.prefix}ytaudio [URL]`,
            baseXp: 20
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        if (!M.urls.length) return void M.reply('🔎 Send a YouTube URL with this command')
        const yt = new YT(M.urls[0], 'audio')
        if (!yt.validateURL()) return void M.reply('⚓ That doesn\'t look like a valid YouTube URL')

        let info: Awaited<ReturnType<typeof yt.getInfo>>
        try {
            info = await yt.getInfo()
        } catch {
            return void M.reply('❌ Could not fetch video info — the video may be unavailable or private')
        }

        if (info.lengthSeconds > MAX_DURATION_AUDIO)
            return void M.reply(`❌ Audio must be under 15 minutes (this is ${Math.floor(info.lengthSeconds / 60)}m)`)

        await M.reply(
            `🎵 *${info.title}*\n👤 ${info.author}\n⏱ ${Math.floor(info.lengthSeconds / 60)}m ${info.lengthSeconds % 60}s\n\n⏳ Downloading...`
        )

        try {
            const buffer = await yt.getBuffer()
            await M.reply(buffer, 'audio')
        } catch (err: any) {
            await M.reply(`❌ Download failed: ${err?.message || 'Unknown error'}`)
        }
    }
}
