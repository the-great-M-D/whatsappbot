"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = require("@adiwajshing/baileys");
class CallHandler {
    constructor(client) {
        this.client = client;
        this.rejectCall = (caller, callID) => __awaiter(this, void 0, void 0, function* () {
            const tag = this.client.generateMessageTag();
            const json = [
                'action',
                'call',
                [
                    'call',
                    {
                        from: this.client.user.jid,
                        to: caller,
                        id: tag
                    },
                    [
                        [
                            'reject',
                            {
                                'call-id': callID,
                                'call-creator': caller,
                                count: '0'
                            },
                            null
                        ]
                    ]
                ]
            ];
            yield this.client.sendWA(`${tag},${JSON.stringify(json)}`);
            yield this.client.sendMessage(caller, `The great 0ne Will Be Intouch With You Shortly`, baileys_1.MessageType.text);
        });
    }
}
exports.default = CallHandler;
