import WAClient from './WAClient'
import { IExtendedGroupMetadata, ISimplifiedMessage } from '../typings'

const URL_REGEX = /(https?:\/\/[^\s]+)/g

export async function buildSimplifiedMessage(
    msg: any,
    client: WAClient
): Promise<ISimplifiedMessage | null> {
    try {
        const key = msg.key
        const from: string = key.remoteJid
        if (!from) return null

        const isGroup = from.endsWith('@g.us')
        const chat: 'group' | 'dm' = isGroup ? 'group' : 'dm'
        const senderJid: string = isGroup
            ? (key.participant || msg.participant || '')
            : (key.fromMe ? (client.user?.id || '') : from)

        const m = msg.message
        if (!m) return null

        const actualMessage =
            m.ephemeralMessage?.message ||
            m.viewOnceMessage?.message ||
            m.viewOnceMessageV2?.message ||
            m

        const getContent = (): string => {
            if (actualMessage.conversation) return actualMessage.conversation
            if (actualMessage.extendedTextMessage?.text) return actualMessage.extendedTextMessage.text
            if (actualMessage.imageMessage?.caption) return actualMessage.imageMessage.caption
            if (actualMessage.videoMessage?.caption) return actualMessage.videoMessage.caption
            if (actualMessage.buttonsResponseMessage?.selectedDisplayText)
                return actualMessage.buttonsResponseMessage.selectedDisplayText
            if (actualMessage.listResponseMessage?.title) return actualMessage.listResponseMessage.title
            return ''
        }

        const content = getContent()
        const args = content.trim().split(/\s+/).filter(Boolean)

        const contextInfo =
            actualMessage.extendedTextMessage?.contextInfo ||
            actualMessage.imageMessage?.contextInfo ||
            actualMessage.videoMessage?.contextInfo ||
            actualMessage.documentMessage?.contextInfo ||
            actualMessage.stickerMessage?.contextInfo ||
            actualMessage.audioMessage?.contextInfo ||
            {}

        const mentioned: string[] = contextInfo.mentionedJid || []

        let groupMetadata: IExtendedGroupMetadata | null = null
        if (isGroup) {
            try {
                const raw = await client.fetchGroupMetadataFromWA(from)
                if (raw) {
                    groupMetadata = {
                        ...raw,
                        admins: raw.participants
                            .filter((p: any) => p.admin || p.superAdmin)
                            .map((p: any) => p.id)
                    }
                }
            } catch { /* ignore */ }
        }

        const senderIsAdmin = groupMetadata?.admins?.includes(senderJid) ?? false
        const contact = client.contacts[senderJid] || {}
        const senderUsername = msg.pushName || contact.notify || contact.name || senderJid.split('@')[0]

        let quoted: ISimplifiedMessage['quoted'] = null
        if (contextInfo?.quotedMessage && contextInfo.stanzaId) {
            quoted = {
                message: {
                    key: {
                        remoteJid: from,
                        id: contextInfo.stanzaId,
                        participant: contextInfo.participant,
                        fromMe: contextInfo.participant === client.user?.id
                    },
                    message: contextInfo.quotedMessage
                } as any,
                sender: contextInfo.participant || (isGroup ? null : from)
            }
        }

        const urls: string[] = content.match(URL_REGEX) || []
        const msgType = Object.keys(actualMessage)[0] || 'text'

        const simplified: ISimplifiedMessage = {
            type: msgType as any,
            content,
            args: args.length ? args : [''],
            mentioned,
            groupMetadata,
            chat,
            from,
            sender: {
                jid: senderJid,
                username: senderUsername,
                isAdmin: senderIsAdmin
            },
            quoted,
            WAMessage: msg,
            urls,
            reply: async (
                replyContent: string | Buffer,
                msgTypeArg?: any,
                mime?: any,
                mention?: string[],
                caption?: string,
                _thumbnail?: Buffer
            ) => {
                const typeStr = String(msgTypeArg || (Buffer.isBuffer(replyContent) ? 'document' : 'text'))
                const mentions = mention || []

                if (Buffer.isBuffer(replyContent)) {
                    if (typeStr === 'sticker') {
                        return client.sock.sendMessage(from, { sticker: replyContent }, { quoted: msg })
                    }
                    if (typeStr === 'image') {
                        return client.sock.sendMessage(from, {
                            image: replyContent,
                            caption: caption || '',
                            mimetype: mime || 'image/jpeg',
                            ...(mentions.length ? { mentions } : {})
                        }, { quoted: msg })
                    }
                    if (typeStr === 'video' || typeStr === 'gif') {
                        return client.sock.sendMessage(from, {
                            video: replyContent,
                            caption: caption || '',
                            gifPlayback: typeStr === 'gif' || mime === 'video/mp4',
                            mimetype: mime || 'video/mp4',
                            ...(mentions.length ? { mentions } : {})
                        }, { quoted: msg })
                    }
                    if (typeStr === 'audio') {
                        return client.sock.sendMessage(from, {
                            audio: replyContent,
                            mimetype: mime || 'audio/mp4',
                            ptt: false
                        }, { quoted: msg })
                    }
                    return client.sock.sendMessage(from, {
                        document: replyContent,
                        mimetype: mime || 'application/octet-stream',
                        fileName: 'file'
                    }, { quoted: msg })
                }

                return client.sock.sendMessage(from, {
                    text: String(replyContent),
                    ...(mentions.length ? { mentions } : {})
                }, { quoted: msg })
            }
        }

        return simplified
    } catch (err: any) {
        client.log(`Error building message: ${err.message}`, true)
        return null
    }
}
