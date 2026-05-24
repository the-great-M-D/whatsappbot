import { config } from 'dotenv'

config()

import MessageHandler from './Handlers/MessageHandler'
import WAClient from './lib/WAClient'
import Server from './lib/Server'
import chalk from 'chalk'
import cron from 'node-cron'
import CallHandler from './Handlers/CallHandler'
import AssetHandler from './Handlers/AssetHandler'
import EventHandler from './Handlers/EventHandler'

const client = new WAClient({
    name: process.env.NAME || 'M_D BOT',
    session: process.env.SESSION || 'M_D',
    prefix: process.env.PREFIX || '!',
    mods: (process.env.MODS || '').split(',').map((number) => `${number}@s.whatsapp.net`),
    gkey: process.env.GOOGLE_API_KEY || '',
    chatBotUrl: process.env.CHAT_BOT_URL || ''
})
client.log('Starting...')

const messageHandler = new MessageHandler(client)
const callHandler = new CallHandler(client)
const assetHandler = new AssetHandler(client)
const eventHandler = new EventHandler(client)
messageHandler.loadCommands()
assetHandler.loadAssets()
messageHandler.loadFeatures()

new Server(Number(process.env.PORT) || 4040, client)

const start = async () => {
    client.once('open', async () => {
        const userNum = client.user?.name || client.user?.notify || client.user?.id?.split(':')[0] || 'unknown'
        client.log(chalk.green(`Connected to WhatsApp as ${chalk.blueBright(userNum)}`))
        await client.saveAuthInfo(client.config.session)
        if (process.env.CRON) {
            if (!cron.validate(process.env.CRON))
                return void client.log(`Invalid Cron String: ${chalk.bgRedBright(process.env.CRON)}`, true)
            client.log(`Cron Job for clearing all chats is set for ${chalk.bgGreen(process.env.CRON)}`)
            cron.schedule(process.env.CRON, async () => {
                client.log('Clearing All Chats...')
                await client.modifyAllChats('clear')
                client.log('Cleared all Chats!')
            })
        }
    })

    client.on('CB:Call', async (json) => {
        const isOffer = json[1]['type'] == 'offer'
        const number = `${(json[1]['from'] as string).split('@')[0]}@s.whatsapp.net`
        if (!isOffer) return void null
        client.log(`${chalk.blue('CALL')} From ${client.contacts[number].notify || number}`)
        await callHandler.rejectCall(number, json[1].id)
    })

    client.on('new-message', messageHandler.handleMessage)

    client.on('group-participants-update', eventHandler.handle)

    await client.connect()
}

client.log(chalk.yellow('Running without database — XP, bans and group configs will not persist'))
start()
