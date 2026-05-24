import { WAParticipantAction } from '../lib/Types'
import chalk from 'chalk'
import request from '../lib/request'
import WAClient from '../lib/WAClient'

export default class EventHandler {
    constructor(public client: WAClient) {}

    handle = async (event: IEvent): Promise<void> => {
        const group = await this.client.fetchGroupMetadataFromWA(event.jid)
        this.client.log(
            `${chalk.blueBright('EVENT')} ${chalk.green(
                `${this.client.util.capitalize(event.action)}[${event.participants.length}]`
            )} in ${chalk.cyanBright(group?.subject || 'Group')}`
        )
        const data = await this.client.getGroupData(event.jid)
        if (!data.events) return void null
        const add = event.action === 'add'
        const text = add
            ? `- ${group.subject || '___'} -\n\n💠 *Group Description:*\n${
                  group.desc
              }\n\nHope you follow the rules and have fun!\n*‣ ${event.participants
                  .map((jid) => `@${jid.split('@')[0]}`)
                  .join(', ')}*`
            : event.action === 'remove'
            ? `*@${event.participants[0].split('@')[0]}* has left the chat 👋`
            : `*@${event.participants[0].split('@')[0]}* got ${this.client.util.capitalize(event.action)}d${
                  event.actor ? ` by *@${event.actor.split('@')[0]}*` : ''
              }`
        const mentions = event.actor ? [...event.participants, event.actor] : event.participants
        if (add) {
            let image: string | Buffer | undefined =
                (await this.client.getProfilePicture(event.jid)) || undefined
            if (!image) image = this.client.assets.get('404')
            if (typeof image === 'string') image = await request.buffer(image)
            if (image)
                return void (await this.client.sock.sendMessage(event.jid, {
                    image: image as Buffer,
                    caption: text,
                    mentions
                }))
        }
        return void this.client.sock.sendMessage(event.jid, { text, mentions })
    }
}

interface IEvent {
    jid: string
    participants: string[]
    actor?: string | undefined
    action: WAParticipantAction
}
