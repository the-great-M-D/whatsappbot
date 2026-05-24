import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'
import request from '../../lib/request'

export default class Command extends BaseCommand {

    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'mtn',
            description: 'sends an HC file for MTN .',
            category: 'files',
            usage: `${client.config.prefix}mtn`,
            baseXp: 30
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        const buffer = await request.buffer('https://github.com/the-great-M-D/HCDecryptor-1/blob/41e78af051a05769eca53b18b1778fafe217803c/mtn.hc')

        return void M.reply(
            buffer,
            'document',
            'application/octet-stream'
        ).catch((reason: any) => M.reply(`✖ An error occurred. Please try again later. ${reason}`))
    }
}
