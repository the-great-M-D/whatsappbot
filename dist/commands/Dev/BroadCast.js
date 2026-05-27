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
            command: 'broadcast',
            description: 'Sends msg to all group chats',
            aliases: ['BC', 'announcement', 'bc'],
            category: 'dev',
            usage: `${client.config.prefix}broadcast`,
            modsOnly: true,
            baseXp: 0
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            const term = joined.trim();
            const chats = Object.keys(this.client.chats).filter((jid) => jid.includes('g.us'));
            for (let i = 0; i < chats.length; i++) {
                const text = `*「 M_D's 🤹 Bot 」* \n 🤹‍♂️ Prefix  : !* \n${term} By *${M.sender.username}*\n 🤹‍♂️ ft the Coding Family 🤹‍♂️`;
                yield this.client.sendMessage(chats[i], { text });
            }
        });
    }
}
exports.default = Command;
