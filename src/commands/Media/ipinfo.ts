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
      

        return void M.reply(

            `🤹 Telkom Is Blocked Try Again Later 😭\n`

        ).catch((reason: Error) => M.reply(`an error occurred, Reason: ${reason}`))

    }

}
