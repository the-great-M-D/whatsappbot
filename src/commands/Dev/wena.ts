import MessageHandler from '../../Handlers/MessageHandler'

import BaseCommand from '../../lib/BaseCommand'

import WAClient from '../../lib/WAClient'

import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {

    constructor(client: WAClient, handler: MessageHandler) {

        super(client, handler, {

            command: 'wena',

            description: 'Generally used to say hie 🤗',

            category: 'dev',

            usage: `${client.config.prefix}wena`,

            baseXp: 0

        })

    }
    
    for(let i = 0, i < 500, i++){
    run = async (M: ISimplifiedMessage): Promise<void> => {
  

        return void (await M.reply(`🤹‍♂️ Ey Mother Fucker 🥃 ${M.sender.username}!`))

    }
    }

}
