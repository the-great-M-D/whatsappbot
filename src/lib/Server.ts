import express, { NextFunction, Request, Response } from 'express'
import { EventEmitter } from 'events'
import WAClient from './WAClient'
import { join } from 'path'

export default class Server extends EventEmitter {
    app = express()
    WARouter = express.Router()

    constructor(public PORT: number, public client: WAClient) {
        super()
        this.app.use(express.json())
        this.app.use(express.static(join(__dirname, '..', '..', 'public')))

        this.app.get('/api/status', (req, res) => {
            res.json({
                connected: this.client.state === 'open',
                pairCode: this.client.pairCode || null,
                pairCodePhone: this.client.pairCodePhone || null,
                user: this.client.state === 'open'
                    ? (this.client.user?.name || this.client.user?.notify || this.client.user?.id?.split(':')[0] || 'Connected')
                    : null
            })
        })

        this.app.post('/api/pair', async (req, res) => {
            try {
                const { phone } = req.body
                if (!phone) return void res.status(400).json({ error: 'Phone number is required' })
                const code = await this.client.connectWithPhone(phone)
                res.json({ code })
            } catch (err: any) {
                res.status(500).json({ error: err.message || 'Failed to generate pairing code' })
            }
        })

        this.app.use('/wa', this.WARouter)
        this.WARouter.use(this.auth)
        this.WARouter.get('/qr', (req, res) => {
            res.json({ message: 'QR disabled — use phone number pairing via the dashboard' })
        })

        this.app.listen(PORT, '0.0.0.0', () => this.client.log(`Server Started on PORT: ${PORT}`))
    }

    auth = (req: Request, res: Response, next: NextFunction): void => {
        const { session } = req.query
        if (!session) return void res.json({ message: `Session Query not provided` })
        if (session !== this.client.config.session) return void res.json({ message: `Invalid Session ID` })
        next()
    }
}
