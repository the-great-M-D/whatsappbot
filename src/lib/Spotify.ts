import Spotify from 'spotifydl-core'

const clientId = process.env.SPOTIFY_CLIENT_ID || ''
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || ''

if (!clientId || !clientSecret) {
    console.warn('[Spotify] SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET env vars not set — spotify commands will fail')
}

const client = new Spotify({ clientId, clientSecret })

export default class {
    constructor(public url: string) {}

    getInfo = async (): Promise<{
        name?: string
        artists?: string[]
        album_name?: string
        release_date?: string
        cover_url?: string
        error?: string
    }> => {
        try {
            return await client.getTrack(this.url)
        } catch {
            return { error: `Error Fetching ${this.url}` }
        }
    }

    getAudio = async (): Promise<Buffer> => await client.downloadTrack<undefined>(this.url)
}
