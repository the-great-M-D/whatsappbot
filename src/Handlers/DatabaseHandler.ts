import { IDBModels } from '../typings'

const makeStub = () => ({
    findOne: async () => null,
    find: async () => [],
    create: async (data: any) => ({ ...data, save: async () => null }),
    deleteOne: async () => null,
    updateOne: async () => null,
})

const makeGroupStub = () => ({
    findOne: async () => null,
    find: async () => [],
    create: async (data: any) => ({
        cmd: true,
        events: false,
        nsfw: false,
        safe: false,
        mod: false,
        invitelink: false,
        ...data,
        save: async () => null
    }),
    deleteOne: async () => null,
    updateOne: async () => null,
})

export default class DatabaseHandler implements IDBModels {
    user = makeStub() as any
    group = makeGroupStub() as any
    session = makeStub() as any
    disabledcommands = makeStub() as any
    feature = makeStub() as any
}
