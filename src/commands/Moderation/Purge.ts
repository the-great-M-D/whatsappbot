import MessageHandler from '../../Handlers/MessageHandler'
import BaseCommand from '../../lib/BaseCommand'
import WAClient from '../../lib/WAClient'
import { ISimplifiedMessage } from '../../typings'

export default class Command extends BaseCommand {
    constructor(client: WAClient, handler: MessageHandler) {
        super(client, handler, {
            command: 'purge',
            description: 'Removes all non-admin group members, then the bot leaves',
            category: 'moderation',
            adminOnly: true,
            usage: `${client.config.prefix}purge`,
            baseXp: 0
        })
    }

    run = async (M: ISimplifiedMessage): Promise<void> => {
        if (!M.groupMetadata) return void M.reply("Couldn't fetch group info. Try again.")

        if (!this.client.isBotAdmin(M.groupMetadata.admins || []))
            return void M.reply("I need to be an admin to purge the group")

        if (!M.sender.isAdmin)
            return void M.reply("Only admins can use this command")

        const groupId = M.from

        if (!this.purgeSet.has(groupId)) {
            this.addToPurge(groupId)
            return void M.reply(
                "⚠️ *Are you sure?* This will remove everyone from the group and I will leave.\n\nRun *!purge* again within 60 seconds to confirm."
            )
        }

        this.purgeSet.delete(groupId)

        const participants = M.groupMetadata.participants || []
        const admins = M.groupMetadata.admins || []

        // Remove non-admins first
        const nonAdmins = participants
            .filter(p => !p.isAdmin && p.jid !== this.client.botJid && p.jid !== this.client.botLid)
        for (const p of nonAdmins) {
            await this.client.groupRemove(groupId, [p.jid]).catch(() => null)
        }

        // Remove admins except the sender and the bot
        const otherAdmins = admins.filter(
            jid => jid !== M.sender.jid && jid !== this.client.botJid && jid !== this.client.botLid
        )
        for (const jid of otherAdmins) {
            await this.client.groupRemove(groupId, [jid]).catch(() => null)
        }

        await M.reply('✅ Done! Leaving now...').catch(() => null)
        await this.client.groupLeave(groupId).catch(() => null)
    }

    purgeSet = new Set<string>()

    addToPurge = (id: string): void => {
        this.purgeSet.add(id)
        setTimeout(() => this.purgeSet.delete(id), 60000)
    }
}
