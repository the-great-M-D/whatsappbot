import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import YT from '../../lib/YT'
import { ISimplifiedMessage } from '../../typings'

const MAX_DURATION_VIDEO = 60 * 10

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'ytvideo',
            description: 'Downloads a YouTube video and sends it as MP4 (max 10 min)',
            category: 'media',
            aliases: ['ytv'],
            usage: `${client.config.prefix}ytvideo [URL]`,
            baseXp: 10
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        if (!M.urls.length) return void M.reply('🔎 Send a YouTube URL with this command')
        const yt = new YT(M.urls[0], 'video')
        if (!yt.validateURL()) return void M.reply('⚓ That doesn\'t look like a valid YouTube URL')

        let info: Awaited<ReturnType<typeof yt.getInfo>>
        try {
            info = await yt.getInfo()
        } catch {
            return void M.reply('❌ Could not fetch video info — the video may be unavailable or private')
        }

        if (info.lengthSeconds > MAX_DURATION_VIDEO)
            return void M.reply(
                `❌ Video is too long (${Math.floor(info.lengthSeconds / 60)}m). Maximum is 10 minutes.\n\nUse *!ytaudio* if you just want the audio.`
            )

        await M.reply(
            `🎬 *${info.title}*\n👤 ${info.author}\n⏱ ${Math.floor(info.lengthSeconds / 60)}m ${info.lengthSeconds % 60}s\n👁 ${info.viewCount} views\n\n⏳ Downloading...`
        )

        try {
            const buffer = await yt.getBuffer()
            await M.reply(buffer, 'video')
        } catch (err: any) {
            await M.reply(`❌ Download failed: ${err?.message || 'Unknown error'}`)
        }
    }
}
