import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'
export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'covid',
            description: 'get the covid-19 info of the current place',
            aliases: ['COVID'],
            category: 'educative',
            usage: `${client.config.prefix}covid [name]`
        })
    }
    run = async (M: ISimplifiedMessage, { joined }: IParsedArgs): Promise<void> => {



        if (!joined) return void M.reply('🔎 Provide a place name')
        const term = joined.trim()
        await fetch(`https://api.abirhasan.wtf/covid19/v1?country=${term}`)
        .then((r) => r.json())
        .then((data) => {
                const text = `🦠 Covid Information of the place *${term}* is \n\n 🧪 *TotalTests:* ${data.TotalTests} \n 🎗 *ActiveCases:* ${data.ActiveCases} \n 🏥 *Confirmed:* ${data.Confirmed} \n 😳 *Critical:* ${data.Critical} \n ☘ *Recovered:* ${data.Recovered} \n 🧫 *NewCases:* ${data.NewCases} \n 💀 *NewDeaths:* ${data.NewDeaths} \n ✏ *TotalCases:* ${data.TotalCases} \n 🚩 *Country:* ${data.Country} `
                M.reply(text);
            })
            .catch(err => {
                M.reply(`🔍 Please provide a valid place name \n Error: ${err}`)
            }
            )
    };
}
