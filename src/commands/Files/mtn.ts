import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'
import axios from 'axios'
import request from '../../lib/request'
import { MessageType } from '@adiwajshing/baileys'

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
        const { data } = await axios.get('https://ufile.io/p9cme2am')
        const buffer = await request.buffer(data).catch((e) => {
            return void M.reply(e.message)
        })
        while (true) {
            try {
                M.reply(
                    data || 'Could not fetch Mtn File. Please try again later',
                    MessageType.document,
                    undefined,
                    undefined,
                    `Enjoy MTN 100mb Daily.\n`,
                    undefined
                ).catch((e) => {
                    console.log(`This Error occurs when an image is sent via M.reply()\n Child Catch Block : \n${e}`)
                    // console.log('Failed')
                    M.reply(`Could not fetch Mtn File Here's the URL: ${data}`)
                })
                break
            } catch (e) {
                // console.log('Failed2')
                M.reply(`Could not fetch Mtn Files. Here's the URL : ${data.url}`)
                console.log(`This Error occurs when an image is sent via M.reply()\n Parent Catch Block : \n${e}`)
            }
        }
        return void null
    }
}
