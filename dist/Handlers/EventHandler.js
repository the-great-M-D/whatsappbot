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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = require("@adiwajshing/baileys");
const chalk_1 = __importDefault(require("chalk"));
const request_1 = __importDefault(require("../lib/request"));
class EventHandler {
    constructor(client) {
        this.client = client;
        this.handle = (event) => __awaiter(this, void 0, void 0, function* () {
            const group = yield this.client.fetchGroupMetadataFromWA(event.jid);
            this.client.log(`${chalk_1.default.blueBright('EVENT')} ${chalk_1.default.green(`${this.client.util.capitalize(event.action)}[${event.participants.length}]`)} in ${chalk_1.default.cyanBright((group === null || group === void 0 ? void 0 : group.subject) || 'Group')}`);
            const data = yield this.client.getGroupData(event.jid);
            if (!data.events)
                return void null;
            const add = event.action === 'add';
            const text = add
                ? `- ${group.subject || '___'} -\n\n💠 *Group Description:*\n${group.desc}\n\nHope you follow the rules and have fun!\n*‣ ${event.participants
                    .map((jid) => `@${jid.split('@')[0]}`)
                    .join(', ')}*`
                : event.action === 'remove'
                    ? `*@${event.participants[0].split('@')[0]}* has left the chat 👋`
                    : `*@${event.participants[0].split('@')[0]}* got ${this.client.util.capitalize(event.action)}d${event.actor ? ` by *@${event.actor.split('@')[0]}*` : ''}`;
            const contextInfo = {
                mentionedJid: event.actor ? [...event.participants, event.actor] : event.participants
            };
            if (add) {
                let image = (yield this.client.getProfilePicture(event.jid)) || this.client.assets.get('404.png');
                if (typeof image === 'string')
                    image = yield request_1.default.buffer(image);
                if (image)
                    return void (yield this.client.sendMessage(event.jid, image, baileys_1.MessageType.image, {
                        caption: text,
                        contextInfo
                    }));
            }
            return void this.client.sendMessage(event.jid, text, baileys_1.MessageType.extendedText, { contextInfo });
        });
    }
}
exports.default = EventHandler;
