import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'status',
            description: 'Posts text, image, or video as a WhatsApp status',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}status [text] — or tag an image/video`,
            devOnly: true,
            baseXp: 30
        })
    }

    run = async (M: ISimplifiedMessage, parsedArgs: IParsedArgs): Promise<void> => {
        parsedArgs.flags.forEach((flag) => (parsedArgs.joined = parsedArgs.joined.replace(flag, '').trim()))

        // Build statusJidList from known contacts (required by Baileys v7)
        const statusJidList = Object.keys(this.client.contacts).filter(j => j.endsWith('@s.whatsapp.net'))

        const sendOpts = { statusJidList }

        try {
            // Quoted image
            if (M.quoted?.message?.message?.imageMessage) {
                await M.reply('⭐ Posting image status…')
                const buffer = await this.client.downloadMediaMessage(M.quoted.message)
                const caption = parsedArgs.joined || ''
                await this.client.sock.sendMessage('status@broadcast', { image: buffer, caption }, sendOpts)
                return void await M.reply('✅ Image status posted')
            }

            // Own image
            if (M.WAMessage.message?.imageMessage) {
                await M.reply('⭐ Posting image status…')
                const buffer = await this.client.downloadMediaMessage(M.WAMessage)
                const caption = parsedArgs.joined || ''
                await this.client.sock.sendMessage('status@broadcast', { image: buffer, caption }, sendOpts)
                return void await M.reply('✅ Image status posted')
            }

            // Quoted video
            if (M.quoted?.message?.message?.videoMessage) {
                await M.reply('✨ Posting video status…')
                const buffer = await this.client.downloadMediaMessage(M.quoted.message)
                const caption = parsedArgs.joined || ''
                await this.client.sock.sendMessage('status@broadcast', { video: buffer, caption }, sendOpts)
                return void await M.reply('✅ Video status posted')
            }

            // Own video
            if (M.WAMessage.message?.videoMessage) {
                await M.reply('✨ Posting video status…')
                const buffer = await this.client.downloadMediaMessage(M.WAMessage)
                const caption = parsedArgs.joined || ''
                await this.client.sock.sendMessage('status@broadcast', { video: buffer, caption }, sendOpts)
                return void await M.reply('✅ Video status posted')
            }

            // Quoted text
            if (M.quoted?.message?.message?.conversation) {
                const text = M.quoted.message.message.conversation
                await M.reply('✨ Posting text status…')
                await this.client.sock.sendMessage('status@broadcast', { text }, sendOpts)
                return void await M.reply('✅ Text status posted')
            }

            // Plain text from args
            const text = parsedArgs.joined
            if (!text) return void M.reply(`Usage: \`${this.config.usage}\`\nOr tag an image/video with optional caption`)
            await M.reply('✨ Posting text status…')
            await this.client.sock.sendMessage('status@broadcast', { text }, sendOpts)
            return void await M.reply('✅ Text status posted')

        } catch (err: any) {
            return void M.reply(`❌ Failed to post status: ${err.message}`)
        }
    }
}
