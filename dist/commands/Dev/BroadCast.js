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
            command: 'broadcast',
            description: 'Sends msg to all group chats',
            aliases: ['BC', 'announcement', 'bc'],
            category: 'dev',
            usage: `${client.config.prefix}broadcast`,
            modsOnly: true,
            baseXp: 0
        });
        this.run = (M, { joined }) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const term = joined.trim();
            const chats = this.client.chats.all().filter(v => !v.read_only && !v.archive).map(v => v.jid).map(jids => jids.includes("g.us") ? jids : null).filter(v => v);
            for (let i = 0; i < chats.length; i++) {
                const text = `*「 M_D's 🤹 Bot 」* \n 🤹‍♂️ Prefix  : !* \n${term} By *${M.sender.username}*\n 🤹‍♂️ ft the Coding Family 🤹‍♂️`;
                this.client.sendMessage(chats[i], text, baileys_1.MessageType.text, { contextInfo: { mentionedJid: (_a = M.groupMetadata) === null || _a === void 0 ? void 0 : _a.participants.map((user) => user.jid) } });
            }
        });
    }
}
exports.default = Command;
