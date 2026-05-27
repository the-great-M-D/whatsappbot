import { tmpdir } from 'os'
import { join } from 'path'
import { readFile, unlink } from 'fs-extra'
import { execFile } from 'child_process'
import { promisify } from 'util'
import ytdl from '@distube/ytdl-core'

const execFileAsync = promisify(execFile)

const YT_DLP = 'yt-dlp'

export interface YTInfo {
    title: string
    author: string
    lengthSeconds: number
    thumbnail: string
    url: string
    viewCount: string
}

export default class YT {
    id: string

    constructor(public url: string, public type: 'audio' | 'video') {
        this.id = this.parseId()
    }

    validateURL = (): boolean => ytdl.validateURL(this.url)

    getInfo = async (): Promise<YTInfo> => {
        const info = await ytdl.getInfo(this.url)
        const d = info.videoDetails
        return {
            title: d.title,
            author: d.author?.name || 'Unknown',
            lengthSeconds: Number(d.lengthSeconds),
            thumbnail: d.thumbnails?.[d.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${this.id}/hqdefault.jpg`,
            url: d.video_url || this.url,
            viewCount: Number(d.viewCount).toLocaleString()
        }
    }

    getBuffer = async (): Promise<Buffer> => {
        const ext = this.type === 'audio' ? 'mp3' : 'mp4'
        const out = join(tmpdir(), `yt_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`)

        const args: string[] = [
            '--no-playlist',
            '--no-warnings',
            '-o', out,
        ]

        if (this.type === 'audio') {
            args.push(
                '-f', 'bestaudio',
                '-x',
                '--audio-format', 'mp3',
                '--audio-quality', '0'
            )
        } else {
            args.push(
                '-f', 'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best[height<=720]',
                '--merge-output-format', 'mp4'
            )
        }

        args.push(this.url)

        await execFileAsync(YT_DLP, args, { timeout: 120_000 })

        const buffer = await readFile(out)
        unlink(out).catch(() => null)
        return buffer
    }

    getThumbnail = async (): Promise<Buffer> => {
        const { default: axios } = await import('axios')
        const resp = await axios.get<Buffer>(`https://i.ytimg.com/vi/${this.id}/hqdefault.jpg`, { responseType: 'arraybuffer' })
        return Buffer.from(resp.data)
    }

    parseId = (): string => {
        try {
            const u = new URL(this.url)
            if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
            return u.searchParams.get('v') || ''
        } catch {
            return ''
        }
    }
}
