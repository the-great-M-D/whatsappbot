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
            command: 'react',
            description: `Let's React`,
            aliases: [
                'r',
                'cry',
                'kiss',
                'bully',
                'hug',
                'lick',
                'cuddle',
                'pat',
                'smug',
                'highfive',
                'bonk',
                'yeet',
                'blush',
                'wave',
                'smile',
                'handhold',
                'nom',
                'bite',
                'glomp',
                'kill',
                'slap',
                'cringe',
                'kick',
                'wink',
                'happy',
                'poke',
                'dance'
            ],
            category: 'fun',
            usage: `${client.config.prefix}(reaction) [tag/quote users]\nExample: ${client.config.prefix}pat`,
            baseXp: 10
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            var _b, _c;
            const action = ((_b = M.content) === null || _b === void 0 ? void 0 : _b.split(' ')[0].slice(1).toLowerCase()) || '';
            let flag = true;
            if (!(action === 'r' || action === 'react')) {
                flag = false;
            }
            const Reactions = {
                cry: ['Cried with', 'is Crying by'],
                kiss: ['Kissed'],
                bully: ['Bullied'],
                hug: ['Hugged'],
                lick: ['Licked'],
                cuddle: ['Cuddled with'],
                pat: ['Patted'],
                smug: ['Smugged at', 'is Smugging by'],
                highfive: ['High-fived'],
                bonk: ['Bonked'],
                yeet: ['Yeeted'],
                blush: ['Blushed at', 'is Blushing by'],
                wave: ['Waved at'],
                smile: ['Smiled at', 'is Smiling by'],
                handhold: ['is Holding Hands with'],
                nom: ['is Eating with', 'is Eating by'],
                bite: ['Bit'],
                glomp: ['Glomped'],
                kill: ['Killed'],
                slap: ['Slapped'],
                cringe: ['Cringed at'],
                kick: ['Kicked'],
                wink: ['Winked at'],
                happy: ['is Happy with', 'is Happy by'],
                poke: ['Poked'],
                dance: ['is Dancing with', 'is Dancing by']
            };
            const term = flag ? joined.split(' ')[0].toLowerCase() : action;
            let text = '';
            Object.keys(Reactions).map((reaction) => {
                text += `📍${reaction.charAt(0).toUpperCase() + reaction.slice(1)}\n`;
            });
            text += `🎀 *Usage:* ${this.client.config.prefix}(reaction) [tag/quote users]\nExample: ${this.client.config.prefix}pat`;
            if (flag) {
                if (!term)
                    return void M.reply(`🪧 *OPTIONS:*\n${text}`);
                if (!Object.keys(Reactions).includes(term))
                    return void M.reply(`🧧 No Reaction Found 🧧\nUse ${this.client.config.prefix}r to see all available reactions`);
            }
            if ((_c = M.quoted) === null || _c === void 0 ? void 0 : _c.sender)
                M.mentioned.push(M.quoted.sender);
            if (!M.mentioned.length)
                M.mentioned.push(M.sender.jid);
            M.mentioned = [...new Set(M.mentioned)];
            let grammar;
            M.mentioned[0] === M.sender.jid
                ? (grammar = Reactions[`${term}`].pop() || Reactions[`${term}`][0])
                : (grammar = Reactions[`${term}`][0]);
            M.reply(yield this.client.util.GIFBufferToVideoBuffer(yield this.client.getBuffer((yield this.client.fetch(`https://api.waifu.pics/sfw/${term}`)).data.url)), 'gif', 'video/mp4', [M.sender.jid, ...M.mentioned], `*@${M.sender.jid.split('@')[0]} ${grammar} ${M.mentioned
                .map((user) => (user === M.sender.jid ? 'Themselves' : `@${user.split('@')[0]}`))
                .join(', ')}*`);
        });
    }
}
exports.default = Command;
