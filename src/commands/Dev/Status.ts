import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'status',
            description: 'Puts the text as status ',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}status [text] [tag Image/Video]`,
            modsOnly: true,
            baseXp: 30
        })
    }

    run = async (M: ISimplifiedMessage, parsedArgs: IParsedArgs): Promise<void> => {
        parsedArgs.flags.forEach((flag) => (parsedArgs.joined = parsedArgs.joined.replace(flag, '')))
        const args = parsedArgs.joined.split(',')
        let buffer
        if (M.quoted?.message?.message?.imageMessage) {
            M.reply('⭐ Posting Image Status')
            let i = 0
            while (i < 5) {
                try {
                    buffer = await this.client.downloadMediaMessage(M.quoted.message)
                    const caption = args[0] || ''
                    return void this.client.sock.sendMessage('status@broadcast', { image: buffer, caption })
                } catch {
                    i += 1
                    M.reply('Marker Not Found Error : https://github.com/oliver-moran/jimp/issues/102 ')
                }
            }
        } else if (M.WAMessage.message?.imageMessage) {
            M.reply('Posting Image Status ⭐')
            buffer = await this.client.downloadMediaMessage(M.WAMessage)
            const caption = args[0] || ''
            this.client.sock.sendMessage('status@broadcast', { image: buffer, caption })
        } else if (M.quoted?.message?.message?.videoMessage) {
            M.reply('Posting Video Status ✨')
            buffer = await this.client.downloadMediaMessage(M.quoted.message)
            const caption = args[0] || ''
            this.client.sock.sendMessage('status@broadcast', { video: buffer, caption })
        } else if (M.WAMessage.message?.videoMessage) {
            M.reply('✨ Posting Video Status')
            buffer = await this.client.downloadMediaMessage(M.WAMessage)
            const caption = args[0] || ''
            this.client.sock.sendMessage('status@broadcast', { video: buffer, caption })
        } else if (M.quoted?.message?.message?.conversation) {
            M.reply('✨ Posting Text Status')
            const text = M.quoted?.message?.message?.conversation || ''
            this.client.sock.sendMessage('status@broadcast', { text })
        } else if (!M.quoted?.message) {
            M.reply('Posting Text Status ✨')
            const text = args[0] || ''
            M.reply(`text : ${text}`)
            this.client.sock.sendMessage('status@broadcast', { text })
        } else M.reply('Use Image/Video via Tagging it or/and use text')
    }
}
