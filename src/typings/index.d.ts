export * from './message'
export * from './command'
export * from './mongo'
export interface IConfig {
    name: string
    prefix: string
    session: string
    mods: string[]
    gkey: string
    chatBotUrl: string
}

export interface IParsedArgs {
    args: string[]
    flags: string[]
    joined: string
}

export interface IGroupParticipant {
    jid: string
    isAdmin?: boolean
    isSuperAdmin?: boolean
    admin?: 'admin' | 'superadmin' | null
}

export interface IExtendedGroupMetadata {
    id: string
    subject: string
    owner?: string
    desc?: string
    participants: IGroupParticipant[]
    announce?: boolean
    restrict?: boolean
    admins?: string[]
    inviteCode?: string
    subjectTime?: number
    creation?: number
    ephemeralDuration?: number
}

export interface ISession {
    clientID: string
    serverToken: string
    clientToken: string
    encKey: string
    macKey: string
}

export interface IGroup {
    jid: string
    events: boolean
    nsfw: boolean
    safe: boolean
    mod: boolean
    cmd: boolean
    invitelink: boolean
}

export interface IUser {
    jid: string
    ban: boolean
    warnings: number
    Xp: number
}

export interface IFeature {
    feature: string
    state: boolean
}

export interface IPackage {
    description: string
    dependencies: { [key: string]: string }
    homepage: string
    repository: {
        url: string
    }
}
