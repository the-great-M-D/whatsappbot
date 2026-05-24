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
class CallHandler {
    constructor(client) {
        this.client = client;
        this.rejectCall = (caller, callID) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.sock.rejectCall(callID, caller);
            }
            catch ( /* ignore */_a) { /* ignore */ }
            yield this.client.sendMessage(caller, { text: 'The great 0ne Will Be Intouch With You Shortly' });
        });
    }
}
exports.default = CallHandler;
