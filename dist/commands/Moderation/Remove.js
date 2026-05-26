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
            aliases: ['boom', 'kick'],
            command: 'remove',
            description: 'removes the mentioned users',
            category: 'moderation',
            usage: `${client.config.prefix}remove [@mention | tag]`,
            baseXp: 10
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let text = '*Action*\n\n';
            if (!this.client.isBotAdmin(((_a = M.groupMetadata) === null || _a === void 0 ? void 0 : _a.admins) || []))
                return void M.reply(`❌ Failed to ${this.config.command} as I'm not the group admin`);
            if ((_b = M.quoted) === null || _b === void 0 ? void 0 : _b.sender)
                M.mentioned.push(M.quoted.sender);
            if (!M.mentioned.length)
                return void M.reply(`Please tag the users you want to ${this.config.command}`);
            M.mentioned.forEach((user) => __awaiter(this, void 0, void 0, function* () {
                var _c;
                // const usr = this.client.contacts[user]
                // const username = usr.notify || usr.vname || usr.name || user.split('@')[0]
                if (((_c = M.groupMetadata) === null || _c === void 0 ? void 0 : _c.owner.split('@')[0]) === user.split('@')[0]) {
                    text += `❌ Skipped *@${user.split('@')[0]}* as they're owner.\n`;
                }
                // check if user is Bot
                else if (this.client.botJid === user) {
                    text += `❌ Skipped *@${user.split('@')[0]}* as they're me.\n`;
                }
                else {
                    text += `🟥 Removed *@${user.split('@')[0]}*\n`;
                    yield this.client.groupRemove(M.from, [user]);
                }
            }));
            yield M.reply(`${text}`, undefined, undefined, [...M.mentioned, M.sender.jid]);
        });
    }
}
exports.default = Command;
