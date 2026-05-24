export const MessageType = {
    text: 'text',
    extendedText: 'extendedText',
    image: 'image',
    video: 'video',
    audio: 'audio',
    sticker: 'sticker',
    document: 'document',
    gif: 'gif',
} as const
export type MessageType = (typeof MessageType)[keyof typeof MessageType]

export const Mimetype = {
    webp: 'image/webp',
    gif: 'video/mp4',
    jpeg: 'image/jpeg',
    png: 'image/png',
    mp4: 'video/mp4',
    ogg: 'audio/ogg; codecs=opus',
    mp3: 'audio/mpeg',
} as const
export type Mimetype = (typeof Mimetype)[keyof typeof Mimetype]

export type GroupSettingChange = 'announcement' | 'not_announcement' | 'locked' | 'unlocked'
export type WAParticipantAction = 'add' | 'remove' | 'promote' | 'demote'
