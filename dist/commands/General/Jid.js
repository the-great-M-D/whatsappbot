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
            command: 'jid',
            description: 'Shows the JID of yourself, the group, or tagged users',
            category: 'general',
            aliases: ['id'],
            usage: `${client.config.prefix}jid [@mention]`,
            dm: true,
            baseXp: 0
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const lines = [];
            lines.push(`👤 *Your JID:*\n\`${M.sender.jid}\``);
            if (M.chat === 'group') {
                lines.push(`\n👥 *Group JID:*\n\`${M.from}\``);
            }
            if (M.mentioned.length) {
                lines.push(`\n🔖 *Tagged JIDs:*`);
                M.mentioned.forEach((jid) => {
                    lines.push(`\`${jid}\``);
                });
            }
            if ((_a = M.quoted) === null || _a === void 0 ? void 0 : _a.sender) {
                lines.push(`\n💬 *Quoted sender JID:*\n\`${M.quoted.sender}\``);
            }
            lines.push(`\n🤖 *Bot JID:*\n\`${this.client.botJid}\``);
            return void M.reply(lines.join('\n'));
        });
    }
}
exports.default = Command;
