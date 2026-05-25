import mongoose from 'mongoose'
import { IDBModels } from '../typings'
import UserModel from '../lib/Mongo/Models/User'
import GroupModel from '../lib/Mongo/Models/Group'
import SessionModel from '../lib/Mongo/Models/Session'
import DisabledCommandsModel from '../lib/Mongo/Models/DisabledCommands'
import FeatureModel from '../lib/Mongo/Models/Features'

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
    user: any = makeStub()
    group: any = makeGroupStub()
    session: any = makeStub()
    disabledcommands: any = makeStub()
    feature: any = makeStub()

    connected = false

    async connect(): Promise<void> {
        const uri = process.env.MONGODB_URI
        if (!uri) {
            console.log('[DB] No MONGODB_URI set — running without database')
            return
        }
        try {
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 8000,
                useNewUrlParser: true,
                useUnifiedTopology: true,
            } as any)
            this.user = UserModel
            this.group = GroupModel
            this.session = SessionModel
            this.disabledcommands = DisabledCommandsModel
            this.feature = FeatureModel
            this.connected = true
            console.log('[DB] Connected to MongoDB')
        } catch (err: any) {
            console.error(`[DB] MongoDB connection failed: ${err.message} — running without database`)
        }
    }
}
