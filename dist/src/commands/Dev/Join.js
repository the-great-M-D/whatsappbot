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
const BaseCommand_1 = __importDefault(require("../../lib/BaseCommand"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'join',
            description: 'Bot Joins the group',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}join`,
            modsOnly: true,
            baseXp: 50
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!M.urls.length)
                return void M.reply('Link?');
            const url = M.urls.find((url) => url.includes('chat.whatsapp.com'));
            if (!url)
                return void M.reply('No WhatsApp Invite URLs found in your message');
            if ((_a = this.client.config.mods) === null || _a === void 0 ? void 0 : _a.includes(M.sender.jid)) {
                const groups = this.client.chats
                    .all()
                    .filter((chat) => chat.jid.endsWith('g.us'))
                    .map((chat) => chat.jid);
                const s = url.split('/');
                const { status, gid } = yield this.client.acceptInvite(s[s.length - 1]).catch(() => ({ status: 401 }));
                if (status === 401)
                    return void M.reply('Cannot join group. Maybe, I was removed from there before');
                if (groups.includes(gid))
                    return void M.reply('Already there');
                return void M.reply(`Joined ${(yield this.client.fetchGroupMetadataFromWA(gid)).subject}`);
            }
        });
    }
}
exports.default = Command;
