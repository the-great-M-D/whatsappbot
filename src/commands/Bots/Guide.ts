import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'guide',
            description: 'Lists All M_D Guides',
            category: 'bots',
            usage: `${client.config.prefix}guide`,
            baseXp: 200
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        let text = ''
        text += '*🤹  M_D 🤹 *\n'
        text += '*🔗 README* : https://github.com/the-great-M-D/Kaoi#readme\n'
        text += '*🔗 FEATURES* : https://github.com/the-great-M-D/Kaoi/blob/main/Features.md\n'
        text += '*🔗 CONTRIBUTERS* : https://github.com/the-great-M-D/Kaoi/graphs/contributors\n'
        text += '*🔗 FAQ* : https://github.com/the-great-M-D/Kaoi/blob/main/Troubleshooting%20and%20faq.md\n'
        text += '\n*🤹  DEPLOY GUIDES 🤹 *\n'
        text += `*🔗 Deploy Video Guide 🔗 : https://www.youtube.com/watch?v=tsCCmxeklHw*
            Follow this video Guide but instead of using the *WhatsApp Botto Xre* Link, use the *Kaoi Github Link* given above.\n`
        text += '🔗 Deploy Text Guide (Detailed) 🔗 : https://github.com/the-great-M-D7/Kaoi-Guides#readme\n'
        text += '\n🤹  SPECIFIC GUIDES 🤹 \n'
        text += '🔗 How to get the ChatBot URL : https://github.com/the-great-M-D/Kaoi-Guides/blob/main/Chat_Bot_Url.md\n'
        text += `🔗 How to use ${this.client.config.prefix}sticker effectively : https://github.com/the-great-M-D/Kaoi-Guides/blob/main/Sticker-feature-Guide.md\n`
        text +=
            '🔗 How to get the MongoDB URL : https://github.com/the-great-M-D/Kaoi-Guides/blob/main/Mongo-Atlas-guide.md\n'
        text += '🔗 App sleeping? : https://www.youtube.com/watch?v=B9SvhFWKloM\n'
        text += '\n_Thank You for using the Bot. Help others setup WhatsApp Bot by contribution to Kaoi Guides_'
        return void M.reply(text).catch((reason: Error) => M.reply(`an error occurred, Reason: ${reason}`))
    }
}
