import request from './request'
import { createWriteStream, readFile } from 'fs-extra'
import { tmpdir } from 'os'
import ytdl, { validateURL } from 'ytdl-core'

export default class YT {
    id: string

    constructor(public url: string, public type: 'audio' | 'video') {
        this.id = this.parseId()
    }

    validateURL = (): boolean => validateURL(this.url)

    getInfo = async (): Promise<ytdl.videoInfo> => await ytdl.getInfo(this.url)

    getBuffer = async (
        filename = `${tmpdir()}/${Math.random().toString(36)}.${this.type === 'audio' ? 'mp3' : 'mp4'}`
    ): Promise<Buffer> => {
        const writeStream = createWriteStream(filename)
        const ytStream = ytdl(this.url, { quality: this.type === 'audio' ? 'highestaudio' : 'highest' })
        ytStream.pipe(writeStream)
        filename = await new Promise((resolve, reject) => {
            ytStream.on('error', reject)
            writeStream.on('finish', () => resolve(filename))
            writeStream.on('error', reject)
        })
        return await readFile(filename)
    }

    getThumbnail = async (): Promise<Buffer> => await request.buffer(`https://i.ytimg.com/vi/${this.id}/hqdefault.jpg`)

    parseId = (): string => {
        const split = this.url.split('/')
        if (this.url.includes('youtu.be')) return split[split.length - 1]
        return this.url.split('=')[1]
    }
}
