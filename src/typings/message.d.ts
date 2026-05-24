import { IExtendedGroupMetadata } from '.'

export interface ISimplifiedMessage {
    type: string
    content: string | null
    args: string[]
    reply(
        content: string | Buffer,
        type?: string,
        mime?: string,
        mention?: string[],
        caption?: string,
        thumbnail?: Buffer
    ): Promise<unknown>
    mentioned: string[]
    groupMetadata: IExtendedGroupMetadata | null
    chat: 'group' | 'dm'
    from: string
    sender: {
        jid: string
        username: string
        isAdmin: boolean
    }
    quoted?: {
        message?: any | null
        sender?: string | null
    } | null
    WAMessage: any
    urls: string[]
}
