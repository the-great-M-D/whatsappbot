import MessageHandler from '../../Handlers/MessageHandler'

import BaseCommand from '../../lib/BaseCommand'

import WAClient from '../../lib/WAClient'

import { ISimplifiedMessage } from '../../typings'

import axios from 'axios'



export default class Command extends BaseCommand {

    constructor(client: WAClient, handler: MessageHandler) {

        super(client, handler, {

            command: 'ipinfo',

            description: 'Get more information abt an IP address.',

            category: 'files',

            usage: `${client.config.prefix}ipinfo`,

            baseXp: 30

        })

    }



    

    run = async (M: ISimplifiedMessage): Promise<void> => {

        // fetch result of https://waifu.pics/api/sfw/waifu from the API using axios

        const { data } = await axios.get('https://waifu.pics/api/sfw/waifu')

        const buffer = await request.buffer(data.url).catch((e) => {

            return void M.reply(e.message)

        })

        while (true) {

            try {

                M.reply(

                    buffer || 'Could not fetch image. Please try again later',

                    MessageType.image,

                    undefined,

                    undefined,

                    `More than one waifu, will ruin your laifu.\n`,

                    undefined

                ).catch((e) => {

                    console.log(`This Error occurs when an image is sent via M.reply()\n Child Catch Block : \n${e}`)

                    // console.log('Failed')

                    M.reply(`Could not fetch image. Here's the URL: ${data.url}`)

                })

                break

            } catch (e) {

                // console.log('Failed2')

                M.reply(`Could not fetch image. Here's the URL : ${data.url}`)

                console.log(`This Error occurs when an image is sent via M.reply()\n Parent Catch Block : \n${e}`)

            }

        }

        return void null

    }
}
