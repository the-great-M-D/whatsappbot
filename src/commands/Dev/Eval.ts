import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'

const EVAL_TIMEOUT_MS = 5000

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'eval',
            description: 'Evaluates JavaScript (dev only)',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}eval [JS code]`,
            devOnly: true,
            baseXp: 0
        })
    }

    run = async (M: ISimplifiedMessage, parsedArgs: IParsedArgs): Promise<void> => {
        const code = parsedArgs.joined.trim()
        if (!code) return void M.reply('No code provided')

        console.log(`[Eval] ${M.sender.jid} → ${code.slice(0, 200)}`)

        let out: string
        try {
            const result = await Promise.race([
                Promise.resolve().then(() => eval(code)),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Eval timed out after ${EVAL_TIMEOUT_MS}ms`)), EVAL_TIMEOUT_MS)
                )
            ])
            out = result !== undefined ? JSON.stringify(result, null, 2) : 'Executed successfully (no return value)'
        } catch (err: any) {
            out = `❌ ${err.message}`
        }

        return void await M.reply(out.slice(0, 4000))
    }
}
