import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, { command: 'trigger', description: 'Sends the triggered version of you', category: 'fun', usage: `${client.config.prefix}trigger`, baseXp: 10 })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        let Canvas: any, GIFEncoder: any
        try { Canvas = require('canvas'); GIFEncoder = require('gifencoder') } catch { return void M.reply('This command is not available in this environment.') }
        try {
            const image = await (M.WAMessage?.message?.imageMessage ? this.client.downloadMediaMessage(M.WAMessage) : M.quoted?.message?.message?.imageMessage ? this.client.downloadMediaMessage(M.quoted.message) : M.quoted?.sender ? this.client.getProfilePicture(M.quoted.sender) : M.mentioned ? this.client.getProfilePicture(M.mentioned[0]) : this.client.getProfilePicture(M.sender.jid))
            const img = await Canvas.loadImage(image)
            const gif = new GIFEncoder(256, 310); gif.start(); gif.setRepeat(0); gif.setDelay(15)
            const canvas = Canvas.createCanvas(256, 310); const ctx = canvas.getContext('2d')
            for (let i = 0; i < 9; i++) { ctx.clearRect(0, 0, 256, 310); ctx.drawImage(img, Math.floor(Math.random() * 20) - 20, Math.floor(Math.random() * 20) - 20, 276, 276); gif.addFrame(ctx) }
            gif.finish()
            return void (await M.reply(gif.out.getData(), 'gif'))
        } catch (err: any) { return void M.reply(`Couldn't fetch the required Image.\nError: ${err?.message || err}`) }
    }
}
