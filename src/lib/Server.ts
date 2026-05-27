import express, { NextFunction, Request, Response } from 'express'
import { EventEmitter } from 'events'
import WAClient from './WAClient'
import { join } from 'path'
import MessageHandler from '../Handlers/MessageHandler'

export interface DashEvent {
    id: string
    type: 'message' | 'command' | 'group' | 'call' | 'connect' | 'disconnect' | 'system'
    icon: string
    title: string
    detail: string
    ts: number
}

export default class Server extends EventEmitter {
    app = express()
    WARouter = express.Router()
    private sseClients = new Set<Response>()
    private eventBuffer: DashEvent[] = []
    private stats = { messages: 0, commands: 0 }
    private startTime = Date.now()
    private handler: MessageHandler | null = null

    constructor(public PORT: number, public client: WAClient) {
        super()
        this.app.use(express.json())
        this.app.use(express.static(join(__dirname, '..', '..', 'public')))

        // ── Pairing / status ────────────────────────────────────────────────
        this.app.get('/api/status', (_req, res) => {
            res.json({
                connected: this.client.state === 'open',
                pairCode: this.client.pairCode || null,
                pairCodePhone: this.client.pairCodePhone || null,
                user: this.client.state === 'open'
                    ? (this.client.user?.name || this.client.user?.notify || this.client.user?.id?.split(':')[0] || 'Connected')
                    : null
            })
        })

        this.app.post('/api/pair', this.auth, async (req, res) => {
            try {
                const { phone } = req.body
                if (!phone) return void res.status(400).json({ error: 'Phone number is required' })
                const code = await this.client.connectWithPhone(phone)
                res.json({ code })
            } catch (err: any) {
                res.status(500).json({ error: err.message || 'Failed to generate pairing code' })
            }
        })

        // ── Stats ────────────────────────────────────────────────────────────
        this.app.get('/api/stats', (_req, res) => {
            const commandsLoaded = this.handler ? this.handler.commands.size : 0
            res.json({
                connected: this.client.state === 'open',
                user: this.client.state === 'open'
                    ? (this.client.user?.name || this.client.user?.id?.split(':')[0] || 'Connected')
                    : null,
                messages: this.stats.messages,
                commands: this.stats.commands,
                commandsLoaded,
                uptime: Date.now() - this.startTime,
                prefix: this.client.config?.prefix || '!'
            })
        })

        // ── Commands list ─────────────────────────────────────────────────────
        this.app.get('/api/commands', (_req, res) => {
            if (!this.handler) return void res.json({ categories: {} })
            const categories: Record<string, string[]> = {}
            this.handler.commands.forEach((cmd) => {
                const cat = cmd.config.category || 'other'
                if (!categories[cat]) categories[cat] = []
                categories[cat].push(cmd.config.command)
            })
            // sort each category list alphabetically
            for (const cat of Object.keys(categories)) categories[cat].sort()
            res.json({ categories })
        })

        // ── SSE event stream ──────────────────────────────────────────────────
        this.app.get('/api/events', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Connection', 'keep-alive')
            res.setHeader('X-Accel-Buffering', 'no')
            res.flushHeaders()

            // replay history so new tabs see recent events immediately
            for (const evt of this.eventBuffer) {
                res.write(`data: ${JSON.stringify(evt)}\n\n`)
            }

            this.sseClients.add(res)
            const ping = setInterval(() => {
                try { res.write(': ping\n\n') } catch { /* ignore */ }
            }, 20000)

            req.on('close', () => {
                clearInterval(ping)
                this.sseClients.delete(res)
            })
        })

        // ── Legacy WA router ──────────────────────────────────────────────────
        this.app.use('/wa', this.WARouter)
        this.WARouter.use(this.auth)
        this.WARouter.get('/qr', (_req, res) => {
            res.json({ message: 'QR disabled — use phone number pairing via the dashboard' })
        })

        this.app.listen(PORT, '0.0.0.0', () => this.client.log(`Server Started on PORT: ${PORT}`))

        this.attachClientEvents()
    }

    setHandler(handler: MessageHandler): void {
        this.handler = handler
    }

    private pushEvent(evt: Omit<DashEvent, 'id'>): void {
        const full: DashEvent = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...evt }
        this.eventBuffer.push(full)
        if (this.eventBuffer.length > 200) this.eventBuffer.shift()
        const payload = `data: ${JSON.stringify(full)}\n\n`
        this.sseClients.forEach((res) => {
            try {
                res.write(payload)
                ;(res as any).flush?.()
            } catch { this.sseClients.delete(res) }
        })
    }

    private attachClientEvents(): void {
        this.client.on('new-message', (M: any) => {
            this.stats.messages++
            const isCmd = M.content?.startsWith(this.client.config?.prefix || '!')
            if (!isCmd) {
                const sender = M.sender?.username || M.sender?.jid?.split('@')[0] || '?'
                const group = M.groupMetadata?.subject || null
                this.pushEvent({
                    type: 'message',
                    icon: '💬',
                    title: `${sender}${group ? ` in ${group}` : ' (DM)'}`,
                    detail: (M.content || '').slice(0, 120),
                    ts: Date.now()
                })
            }
        })

        this.client.on('command-executed', ({ command, sender, group }: any) => {
            this.stats.commands++
            this.pushEvent({
                type: 'command',
                icon: '⚡',
                title: `${this.client.config?.prefix || '!'}${command}  ·  ${sender}`,
                detail: group || 'DM',
                ts: Date.now()
            })
        })

        this.client.on('group-participants-update', ({ jid, participants, action, actor }: any) => {
            const icons: Record<string, string> = { add: '👋', remove: '🚪', promote: '⭐', demote: '⬇️' }
            const labels: Record<string, string> = { add: 'joined', remove: 'left', promote: 'promoted in', demote: 'demoted in' }
            const names = (participants || []).map((p: string) => p.split('@')[0]).join(', ')
            const groupName = Object.values(this.client.chats || {}).find((c: any) => c.id === jid) as any
            this.pushEvent({
                type: 'group',
                icon: icons[action] || '👥',
                title: `${names} ${labels[action] || action}`,
                detail: (groupName?.name || groupName?.subject || jid?.split('@')[0] || jid) + (actor ? `  ·  by ${actor.split('@')[0]}` : ''),
                ts: Date.now()
            })
        })

        this.client.on('CB:Call', (call: any) => {
            const from = call.from?.split('@')[0] || 'unknown'
            this.pushEvent({
                type: 'call',
                icon: '📞',
                title: `Incoming call from +${from}`,
                detail: 'Auto-rejected',
                ts: Date.now()
            })
        })

        this.client.on('open', () => {
            const name = this.client.user?.name || this.client.user?.id?.split(':')[0] || 'Bot'
            this.pushEvent({
                type: 'connect',
                icon: '✅',
                title: `Connected as ${name}`,
                detail: 'WhatsApp session active',
                ts: Date.now()
            })
        })
    }

    auth = (req: Request, res: Response, next: NextFunction): void => {
        const session = (req.query.session ?? req.body?.session) as string | undefined
        if (!session) return void res.status(401).json({ message: `Session not provided` })
        if (session !== this.client.config.session) return void res.status(403).json({ message: `Invalid session` })
        next()
    }
}
