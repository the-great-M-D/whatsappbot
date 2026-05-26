import { remove as fsRemove } from 'fs-extra'
import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import { clearAuthFromDB } from '../../lib/MongoAuthState'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'killswitch',
            description: 'Wipes auth, session and DB records then forces a re-pair',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}killswitch`,
            modsOnly: true,
            baseXp: 0
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        await M.reply('🔴 *KILLSWITCH ACTIVATED*\nClearing auth, session and database records...')

        const authDir = `auth/${this.client.config.session}`

        try {
            await fsRemove(authDir)
        } catch { /* ignore if already gone */ }

        if (this.client.DB.connected) {
            await clearAuthFromDB(this.client.DB.session)
            try { await (this.client.DB.session as any).deleteMany({}) } catch { /* ignore */ }
        }

        await M.reply('✅ Auth and session wiped.\n♻️ Reconnecting — you will need to re-pair the bot.')

        setTimeout(() => {
            this.client.emit('killswitch')
        }, 2000)
    }
}
