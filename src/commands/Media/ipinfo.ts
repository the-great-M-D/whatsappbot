import MessageHandler from '../../Handlers/MessageHandler'

import BaseCommand from '../../lib/BaseCommand'

import WAClient from '../../lib/WAClient'

import { ISimplifiedMessage } from '../../typings'
import request from '../../lib/request'

import { MessageType } from '@adiwajshing/baileys'

// import { MessageType, Mimetype } from '@adiwajshing/baileys'


import axios from 'axios'



export default class Command extends BaseCommand {

    constructor(client: WAClient, handler: MessageHandler) {

        super(client, handler, {

            command: 'ipinfo',

            description: 'Get more information abt an IP address.',

            category: 'dev',

            usage: `${client.config.prefix}ipinfo {term}`,

            baseXp: 30

        })

    }



    

    run = async (M: ISimplifiedMessage): Promise<void> => {

        // fetch result of https://waifu.pics/api/sfw/waifu from the API using axios

        const { data } = await axios.get('https://ipinfo.io/{term}')

        const buffer = await request.buffer(data.url).catch((e) => {

            return void M.reply(e.message)

        })

        while (true) {

            try {

                M.reply(

                    buffer || 'Could not fetch File Please try again later',

                    MessageType.document,

                    undefined,

                    undefined,

                    `ENJOY MTN BY M_D 🤹.\n`,

                    undefined

                ).catch((e) => {

                    console.log(`This Error occurs when an file is sent via M.reply()\n Child Catch Block : \n${e}`)

                    // console.log('Failed')

                    M.reply(`Could not fetch file. Here's the URL: ${data.url}`)

                })

                break

            } catch (e) {

                // console.log('Failed2')

                M.reply(`Could not fetch file. Here's the URL : ${data.url}`)

                console.log(`This Error occurs when an file is sent via M.reply()\n Parent Catch Block : \n${e}`)

            }

        }

        return void null

    }
}
