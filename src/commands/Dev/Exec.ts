import { exec } from 'child_process'
import { promisify } from 'util'
import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'

const execAsync = promisify(exec)
const EXEC_TIMEOUT_MS = 15000
const MAX_OUTPUT = 4000

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'exec',
            description: 'Execute a terminal command (dev only)',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}exec [command]`,
            devOnly: true,
            baseXp: 0
        })
    }

    run = async (M: ISimplifiedMessage, parsedArgs: IParsedArgs): Promise<void> => {
        const cmd = parsedArgs.joined.trim()
        if (!cmd) return void M.reply('No command provided. Usage: !exec <command>')

        console.log(`[Exec] ${M.sender.jid} -> ${cmd.slice(0, 200)}`)

        try {
            const { stdout, stderr } = await execAsync(cmd, {
                timeout: EXEC_TIMEOUT_MS,
                maxBuffer: 1024 * 1024,
                cwd: process.cwd()
            })

            let output = ''
            if (stdout) output += stdout.trim()
            if (stderr) output += (output ? '\n' : '') + `STDERR:\n${stderr.trim()}`
            if (!output) output = 'Command executed (no output)'

            // Split long output
            if (output.length > MAX_OUTPUT) {
                const chunks: string[] = []
                for (let i = 0; i < output.length; i += MAX_OUTPUT) {
                    chunks.push(output.slice(i, i + MAX_OUTPUT))
                }
                for (let i = 0; i < chunks.length; i++) {
                    await M.reply(`Output (${i + 1}/${chunks.length}):\n\`\`\`\n${chunks[i]}\n\`\`\``)
                }
            } else {
                await M.reply(`\`\`\`\n${output}\n\`\`\``)
            }
        } catch (err: any) {
            const errMsg = err.stderr || err.message || 'Unknown error'
            await M.reply(`❌ Error:\n\`\`\`\n${errMsg.slice(0, MAX_OUTPUT)}\n\`\`\``)
        }
    }
}
