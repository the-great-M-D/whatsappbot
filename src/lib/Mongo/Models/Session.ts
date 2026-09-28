import { Schema, model } from 'mongoose'
import { ISessionModel } from '../../../typings'

const SessionSchema = new Schema({
    ID: {
        type: String,
        required: true,
        unique: true
    },
    session: {
        type: Schema.Types.Mixed,
        required: false
    }
})

export default model<ISessionModel>('session', SessionSchema)
