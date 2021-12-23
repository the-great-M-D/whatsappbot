import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'
import axios from 'axios'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'ip',
            aliases: ['g', 'search'],
            description: 'Search fro more information abt an ip ',
            category: 'media',
            usage: `${client.config.prefix}google [query]`,
            baseXp: 10
        })
    }
    run = async (M: ISimplifiedMessage, { joined }: IParsedArgs): Promise<void> => {
        if (!joined) return void M.reply('🔎 Provide a IP Address')
        const term = joined.trim()
        await axios
            .get(
                `https://ipinfo.io/${term}/json`
            )
            .then((res) => {
                if (res.status !== 200) return void M.reply(`🔍 Error: ${res.status}`)
                // return void M.reply(`🔍Command Used : ${Command.count} times\n Result for *${term}*\n\n\n ${result}`)
                    respons = res.data
                return void M.reply(`🔍 Result for *${term}*\n\n\n ${respons}`)
            })
            .catch((err) => {
                M.reply(`🔍 Error: ${err}`)
            })
    }
}
