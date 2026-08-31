import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'
export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'elements',
            description: 'get the info of the chemical element',
            aliases: ['element'],
            category: 'educative',
            usage: `${client.config.prefix}element [name]`
        })
    }
    run = async (M: ISimplifiedMessage, { joined }: IParsedArgs): Promise<void> => {
        if (!joined) return void M.reply('🔎 Provide a element symbol')
        const term = joined.trim()
        await fetch(`https://neelpatel05.pythonanywhere.com/element/symbol?symbol=${term}`)
            .then((r) => r.json())
            .then((data) => {
                const text = `Information of the element *${term}* is \n 🧪 *Name:* ${data.name} \n ⚛️ *Symbol:* ${data.symbol} \n 📍 *Atomic Number:* ${data.atomicNumber} \n 🧫 *Atomic Mass:* ${data.atomicMass} \n 🎯 *Atomic Radius:* ${data.atomicRadius} \n 🖇 *Bonding type:* ${data.bondingType} \n ⚗ *Density:* ${data.density} \n 🗃 *Group Block:* ${data.groupBlock} \n 🔎 *State:* ${data.standardState}`
                M.reply(text)
            })
            .catch((err) => {
                M.reply(`🔍 Please provide a valid place name \n Error: ${err}`)
            })
    }
}
