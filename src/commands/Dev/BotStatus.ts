import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'botstatus',
            aliases: ['bs', 'botinfo'],
            description: 'Shows bot runtime stats — uptime, memory, ping, and connection info',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}botstatus`,
            devOnly: true,
            baseXp: 0
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        const pingStart = Date.now()
        await M.reply('🏓 Pinging...')
        const ping = Date.now() - pingStart

        const mem = process.memoryUsage()
        const toMB = (b: number) => (b / 1024 / 1024).toFixed(1)

        const fmtUptime = (ms: number) => {
            const s = Math.floor(ms / 1000)
            const d = Math.floor(s / 86400)
            const h = Math.floor((s % 86400) / 3600)
            const m = Math.floor((s % 3600) / 60)
            const sec = s % 60
            if (d > 0) return `${d}d ${h}h ${m}m`
            if (h > 0) return `${h}h ${m}m ${sec}s`
            if (m > 0) return `${m}m ${sec}s`
            return `${sec}s`
        }

        const botUptime = this.client.connectedAt
            ? fmtUptime(Date.now() - this.client.connectedAt)
            : 'Not connected'

        const processUptime = fmtUptime(process.uptime() * 1000)
        const cmdsLoaded = this.handler.commands.size
        const user = this.client.user
        const name = user?.name || user?.vname || user?.short || 'Unknown'
        const number = user?.id
            ? user.id.replace(/:(\d+)@/, '@').split('@')[0]
            : 'Unknown'

        const text = [
            `╔══════════════════╗`,
            `║   🤖 *BOT STATUS*   ║`,
            `╚══════════════════╝`,
            ``,
            `*📡 Connection*`,
            `├ Name: ${name}`,
            `├ Number: +${number}`,
            `├ Session: ${this.client.config.session}`,
            `└ Ping: ${ping}ms`,
            ``,
            `*⏱ Uptime*`,
            `├ Bot connected: ${botUptime}`,
            `└ Process running: ${processUptime}`,
            ``,
            `*💾 Memory*`,
            `├ Used: ${toMB(mem.heapUsed)} MB`,
            `├ Total heap: ${toMB(mem.heapTotal)} MB`,
            `└ RSS: ${toMB(mem.rss)} MB`,
            ``,
            `*⚡ Commands*`,
            `└ Loaded: ${cmdsLoaded}`,
            ``,
            `*🛠 Runtime*`,
            `└ Node.js: ${process.version}`,
        ].join('\n')

        return void await M.reply(text)
    }
}
