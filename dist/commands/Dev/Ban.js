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
            command: 'ban',
            description: 'Bans the tagged users globally',
            category: 'dev',
            usage: `${client.config.prefix}ban [@tag]`,
            modsOnly: true,
            baseXp: 0
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const immortals = this.client.config.mods
                ? [M.sender.jid, this.client.botJid, ...this.client.config.mods]
                : [M.sender.jid, this.client.botJid];
            if ((_a = M.quoted) === null || _a === void 0 ? void 0 : _a.sender)
                M.mentioned.push(M.quoted.sender);
            if (!M.mentioned.length || !M.mentioned[0])
                return void M.reply('Mention the user whom you want to ban');
            let text = '*STATE*\n\n';
            // declare tagged as (string | undefined) []
            // const tagged : (string | undefined)[] = []
            for (const user of M.mentioned) {
                if (immortals.includes(user)) {
                    // tagged.push(user)
                    text += `🟨 @${user.split('@')[0]} is an immortal, can't be banned 🤹‍♂️\n`;
                    continue;
                }
                const data = yield this.client.getUser(user);
                // const info = this.client.getContact(user)
                // const username = info.notify || info.vname || info.name || user.split('@')[0]
                // const username = user.split('@')[0]
                if (data === null || data === void 0 ? void 0 : data.ban) {
                    text += `🟨 @${user.split('@')[0]}: Already Banned 🤹‍♂️\n`;
                    continue;
                }
                yield this.client.banUser(user);
                text += `🟥 @${user.split('@')[0]}: Banned 🤹‍♂️\n`;
            }
            yield M.reply(`${text}`, undefined, undefined, 
            // undefined
            [...M.mentioned, M.sender.jid]);
        });
    }
}
exports.default = Command;
