import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { F } from '../../lib/Formatter'
import { ICommand, IParsedArgs, ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'help',
            description: 'Displays the help menu or shows the info of the command provided',
            category: 'general',
            usage: `${client.config.prefix}help (command_name)`,
            aliases: ['h'],
            baseXp: 30
        })
    }

    run = async (M: ISimplifiedMessage, parsedArgs: IParsedArgs): Promise<void> => {
        if (!parsedArgs.joined) {
            const commands = this.handler.commands.keys()
            const categories: { [key: string]: ICommand[] } = {}
            for (const command of commands) {
                const info = this.handler.commands.get(command)
                if (!command) continue
                if (!info?.config?.category) continue
                if (Object.keys(categories).includes(info.config.category)) categories[info.config.category].push(info)
                else {
                    categories[info.config.category] = []
                    categories[info.config.category].push(info)
                }
            }
            const keys = Object.keys(categories).sort((a, b) => a.localeCompare(b))
            const body: string[] = [F.field('Prefix', this.client.config.prefix)]
            for (const key of keys)
                body.push(
                    '',
                    `▸ *${this.client.util.capitalize(key)}* _(${categories[key].length})_`,
                    `${categories[key].map((command) => command.config?.command).join(' ')}`
                )
            return void M.reply(F.frame('Help', body, `${this.client.config.prefix}help <name> for a command's details`))
        }
        const key = parsedArgs.joined.toLowerCase()
        const command = this.handler.commands.get(key) || this.handler.aliases.get(key)
        if (!command) return void M.reply(F.err(`No command or alias found for "${key}"`))
        const state = await this.client.DB.disabledcommands.findOne({ command: command.config.command })
        const fields: string[] = [
            F.field('Status', state ? 'Disabled' : 'Available'),
            F.field('Category', this.client.util.capitalize(command.config?.category || '')),
            F.field('Group only', JSON.stringify(!(command.config.dm ?? true))),
            F.field('Usage', command.config?.usage || ''),
            F.field('Description', command.config?.description || '')
        ]
        if (command.config.aliases?.length && command.config.command !== 'react')
            fields.splice(2, 0, F.field('Aliases', command.config.aliases.map(this.client.util.capitalize).join(', ')))
        return void M.reply(F.frame(command.config?.command || 'command', fields, `${this.client.config.prefix}${command.config?.command}`))
    }
}
