import WAClient from '../lib/WAClient'

export default class CallHandler {
    constructor(public client: WAClient) {}

    rejectCall = async (caller: string, callID: string): Promise<void> => {
        try {
            await this.client.sock.rejectCall(callID, caller)
        } catch { /* ignore */ }
        await this.client.sendMessage(caller, { text: 'The great 0ne Will Be Intouch With You Shortly' })
    }
}
