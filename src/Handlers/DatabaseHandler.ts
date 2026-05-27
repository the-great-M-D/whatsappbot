import mongoose from 'mongoose'
import { IDBModels } from '../typings'
import SessionModel from '../lib/Mongo/Models/Session'
import { groupStore, userStore, disabledCommandsStore, featureStore } from '../lib/DiskStore'

const makeStub = () => ({
    findOne: async () => null,
    find: async () => [],
    create: async (data: any) => ({ ...data, save: async () => null }),
    deleteOne: async () => null,
    updateOne: async () => null,
})

export default class DatabaseHandler implements IDBModels {
    user: any = userStore
    group: any = groupStore
    session: any = makeStub()
    disabledcommands: any = disabledCommandsStore
    feature: any = featureStore

    connected = false

    async connect(): Promise<void> {
        const uri = process.env.MONGODB_URL || process.env.MONGODB_URI
        if (!uri) {
            console.log('[DB] No MONGODB_URL — auth backup disabled, disk store active')
            return
        }
        try {
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 8000,
            })
            this.session = SessionModel
            this.connected = true
            console.log('[DB] MongoDB connected (auth/session only) — all other data on disk')
        } catch (err: any) {
            console.error(`[DB] MongoDB connection failed: ${err.message} — auth backup disabled`)
        }
    }
}
