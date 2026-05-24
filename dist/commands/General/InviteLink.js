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
const BaseCommand_1 = __importDefault(require("../../lib/BaseCommand"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'invitelink',
            aliases: ['invite', 'linkgc'],
            description: 'Get the group invite link',
            category: 'general',
            usage: `${client.config.prefix}invite`,
            baseXp: 10
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // check if Bot is the admin
            if (!((_b = (_a = M.groupMetadata) === null || _a === void 0 ? void 0 : _a.admins) === null || _b === void 0 ? void 0 : _b.includes(this.client.user.jid)))
                return void M.reply(`I'm not an admin of this group.`);
            if ((yield this.client.getGroupData(M.from)).invitelink) {
                const code = yield this.client.groupInviteCode(M.from).catch(() => {
                    return void M.reply('Could not get the invite link');
                });
                yield this.client.sendMessage(M.sender.jid, `*Invite link:* https://chat.whatsapp.com/${code}`, baileys_1.MessageType.text);
                return void M.reply('Sent you the Group Link in personal message');
            }
            else {
                return void M.reply(`Command not enabled by the admin.\nUse *${this.client.config.prefix}act invitelink* to enable it`);
            }
        });
    }
}
exports.default = Command;
