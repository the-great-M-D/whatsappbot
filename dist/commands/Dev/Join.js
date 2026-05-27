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
            description: 'Bot joins a group via invite link',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}join [whatsapp invite link]`,
            modsOnly: true,
            baseXp: 50
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            if (!M.urls.length)
                return void M.reply('Please send a WhatsApp invite link');
            const url = M.urls.find((url) => url.includes('chat.whatsapp.com'));
            if (!url)
                return void M.reply('No WhatsApp invite URL found in your message');
            const knownGroups = new Set(Object.values(this.client.chats)
                .filter((c) => { var _a, _b; return ((_a = c === null || c === void 0 ? void 0 : c.id) === null || _a === void 0 ? void 0 : _a.endsWith('g.us')) || ((_b = c === null || c === void 0 ? void 0 : c.jid) === null || _b === void 0 ? void 0 : _b.endsWith('g.us')); })
                .map((c) => c.id || c.jid));
            const s = url.split('/');
            const inviteCode = s[s.length - 1];
            const result = yield this.client.acceptInvite(inviteCode).catch(() => ({ status: 401 }));
            if ((result === null || result === void 0 ? void 0 : result.status) === 401)
                return void M.reply('Cannot join — I may have been removed from that group before');
            const gid = (result === null || result === void 0 ? void 0 : result.gid) || (result === null || result === void 0 ? void 0 : result.id);
            if (gid && knownGroups.has(gid))
                return void M.reply('Already in that group');
            if (gid) {
                const meta = yield this.client.fetchGroupMetadataFromWA(gid).catch(() => null);
                return void M.reply(`✅ Joined *${(meta === null || meta === void 0 ? void 0 : meta.subject) || gid}*`);
            }
            return void M.reply('✅ Joined successfully');
        });
    }
}
exports.default = Command;
