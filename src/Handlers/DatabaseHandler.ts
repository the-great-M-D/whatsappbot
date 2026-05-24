import { IDBModels } from '../typings'

const makeStub = (name: string) => ({
    findOne: async () => null,
    find: async () => [],
    create: async (data: any) => ({ ...data, save: async () => null }),
    deleteOne: async () => null,
    updateOne: async () => null,
})

export default class DatabaseHandler implements IDBModels {
    user = makeStub('user') as any
    group = makeStub('group') as any
    session = makeStub('session') as any
    disabledcommands = makeStub('disabledcommands') as any
    feature = makeStub('feature') as any
}
