import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient, { activatableFeatures } from '../../lib/WAClient'
import { IParsedArgs, ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            adminOnly: true,
            command: 'activate',
            aliases: ['act'],
            description: 'activate certain features on group-chats',
            category: 'moderation',
            usage: `${client.config.prefix}activate [events | mod | safe | nsfw | cmd | invitelink]`,
            baseXp: 0
        })
    }

    run = async (M: ISimplifiedMessage, { joined }: IParsedArgs): Promise<void> => {
        const type = joined.trim().toLowerCase() as typeof activatableFeatures[number]
        if (!(activatableFeatures as readonly string[]).includes(type))
            return void M.reply(`🟥 Invalid Option: *${this.client.util.capitalize(type)}*`)
        const data = await this.client.getGroupData(M.from)
        if (data[type]) return void M.reply(`🟨 *${this.client.util.capitalize(type)}* is already *active*`)
        await this.client.DB.group.updateOne({ jid: M.from }, { $set: { [type]: true } })
        this.client.invalidateGroupData(M.from)
        return void M.reply(`🟩 *${this.client.util.capitalize(type)}* is now active`)
    }
}
