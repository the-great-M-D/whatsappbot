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
            command: 'add',
            description: 'adds participant to group chats',
            category: 'moderation',
            usage: `${client.config.prefix}add [numbers/ jid]`,
            aliases: ['add'],
            baseXp: 10
        });
        this.run = (M, parsedArgs) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const number = parsedArgs.joined.replace(/\D+/g, '').replace(/\s+/g, '').toString();
            console.log(number);
            try {
                if (!((_b = (_a = M.groupMetadata) === null || _a === void 0 ? void 0 : _a.admins) === null || _b === void 0 ? void 0 : _b.includes(this.client.botJid)))
                    return void M.reply(`❌ Failed to ${this.config.command} Make me admin first, !!!!!`);
                if (!number.length)
                    return void M.reply(`Please write the user's number you want to ${this.config.command}`);
                this.client.isOnWhatsApp(`${number}@s.whatsapp.net`);
                if (!this.client.groupAdd(M.from, [`${number}@s.whatsapp.net`]))
                    return void M.reply(`the person you are trying to add is not on whatsapp`);
            }
            catch (_c) {
                M.reply(`something went wrong`);
            }
        });
    }
}
exports.default = Command;
