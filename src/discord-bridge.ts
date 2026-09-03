import { config } from 'dotenv'
config()

import {
    Client,
    GatewayIntentBits,
    Partials,
    Events,
    EmbedBuilder
} from 'discord.js'
import chalk from 'chalk'

const TOKEN = process.env.DISCORD_BOT_TOKEN || ''
const BOT_API = process.env.BOT_API_URL || 'http://localhost:4041'
const PREFIX = process.env.PREFIX || '!'
const BRIDGE_CHANNEL = process.env.DISCORD_BRIDGE_CHANNEL || ''

if (!TOKEN) {
    console.error('[Discord Bridge] No DISCORD_BOT_TOKEN provided')
    process.exit(1)
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.Message]
})

client.once(Events.ClientReady, (c) => {
    console.log(chalk.green(`[Discord Bridge] Connected as ${c.user.tag}`))
    console.log(chalk.cyan(`[Discord Bridge] Listening for commands with prefix: ${PREFIX}`))
})

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return
    if (BRIDGE_CHANNEL && message.channelId !== BRIDGE_CHANNEL) return

    const content = message.content.trim()

    // Non-command helpers
    if (content.toLowerCase() === 'status') {
        try {
            const res = await fetch(`${BOT_API}/api/status`)
            const data = await res.json() as any
            const embed = new EmbedBuilder()
                .setTitle('Bot Status')
                .setColor(data.connected ? 0x00ff00 : 0xff0000)
                .addFields(
                    { name: 'Connected', value: data.connected ? 'Yes' : 'No', inline: true },
                    { name: 'User', value: data.user || 'N/A', inline: true },
                    { name: 'Needs Repair', value: data.needsRepair ? 'Yes' : 'No', inline: true }
                )
            await message.reply({ embeds: [embed] })
        } catch (err: any) {
            await message.reply(`Error fetching status: ${err.message}`)
        }
        return
    }

    if (content.toLowerCase() === 'commands' || content.toLowerCase() === 'help') {
        try {
            const res = await fetch(`${BOT_API}/api/commands`)
            const data = await res.json() as any
            const embed = new EmbedBuilder()
                .setTitle('Available Commands')
                .setColor(0xe07b54)
                .setDescription(
                    Object.entries(data.categories || {})
                        .map(([cat, cmds]: [string, any]) =>
                            `**${cat}**\n${cmds.map((c: string) => `\`${PREFIX}${c}\``).join(', ')}`
                        )
                        .join('\n\n')
                )
                .setFooter({ text: `Prefix: ${PREFIX}` })
            await message.reply({ embeds: [embed] })
        } catch (err: any) {
            await message.reply(`Error fetching commands: ${err.message}`)
        }
        return
    }

    if (!content.startsWith(PREFIX)) return

    // It's a command — forward to the bot
    await message.channel.sendTyping()

    try {
        let jid: string | undefined
        let command: string = content

        // "!send <jid> <command>" — execute and send output to a WhatsApp chat
        if (content.startsWith(`${PREFIX}send `)) {
            const parts = content.split(/\s+/)
            if (parts.length >= 3) {
                jid = parts[1]
                command = parts.slice(2).join(' ')
            }
        }

        const res = await fetch(`${BOT_API}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command, jid })
        })

        const data = await res.json() as any

        if (!res.ok) {
            await message.reply(`Error: ${data.error || 'Unknown error'}`)
            return
        }

        const replies = data.replies || []
        if (replies.length === 0) {
            await message.reply('Command executed (no text reply)')
        } else {
            for (const reply of replies) {
                if (reply.length > 1900) {
                    for (let i = 0; i < reply.length; i += 1900) {
                        await message.reply(`\`\`\`\n${reply.slice(i, i + 1900)}\n\`\`\``)
                    }
                } else {
                    await message.reply(reply)
                }
            }
        }

        console.log(chalk.green(`[Bridge] ${command} -> ${replies.length} replies`))
    } catch (err: any) {
        console.error(chalk.red(`[Bridge] Error: ${err.message}`))
        await message.reply(`Failed to execute command: ${err.message}`)
    }
})

client.login(TOKEN).catch((err) => {
    console.error(chalk.red(`[Discord Bridge] Login failed: ${err.message}`))
    process.exit(1)
})
