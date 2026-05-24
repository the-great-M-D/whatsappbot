/* eslint-disable @typescript-eslint/no-explicit-any */
import { proto } from '@whiskeysockets/baileys'
import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'retrieve',
            description: 'retrieve viewOnceMessage WhatsApp Message',
            category: 'media',
            usage: `${client.config.prefix}retrieve [Tag the viewOnceMessage]`,
            baseXp: 10
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        if (!M.quoted) return void (await M.reply(`Quote the "viewOnceMessage" you want to retrieve`))
        const quotedMsg = M.quoted.message?.message as proto.IMessage
        if (
            !quotedMsg?.viewOnceMessage?.message?.videoMessage &&
            !quotedMsg?.viewOnceMessage?.message?.imageMessage
        )
            return void M.reply('Quote the "viewOnceMessage" that you want to retrieve')
        const isImage = !!quotedMsg.viewOnceMessage?.message?.imageMessage
        return void M.reply(
            await this.client.downloadMediaMessage(
                quotedMsg.viewOnceMessage as any
            ),
            isImage ? 'image' : 'video',
            undefined,
            undefined,
            'Abracadabra, 🤹 Open sesame, this message is now public property... M_D"s Bot 🤹'
        )
    }
}
