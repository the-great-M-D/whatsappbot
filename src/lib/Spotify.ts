const clientId = process.env.SPOTIFY_CLIENT_ID || ''
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || ''

if (!clientId || !clientSecret) {
    console.warn('[Spotify] SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET env vars not set — spotify commands will fail')
}

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
        return { error: `Spotify download is not configured. URL: ${this.url}` }
    }

    getAudio = async (): Promise<Buffer> => {
        throw new Error('Spotify download is not configured')
    }
}
