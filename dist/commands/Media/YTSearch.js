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
const yt_search_1 = __importDefault(require("yt-search"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'ytsearch',
            description: 'Searches YouTube and returns top results',
            category: 'media',
            aliases: ['yts'],
            usage: `${client.config.prefix}ytsearch [search term]`,
            baseXp: 20
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            if (!joined)
                return void M.reply('🔎 Provide a search term');
            const term = joined.trim();
            yield M.reply(`🔎 Searching YouTube for *${term}*...`);
            let videos = [];
            try {
                const result = yield (0, yt_search_1.default)(term);
                videos = result.videos;
            }
            catch (_b) {
                return void M.reply('❌ YouTube search failed — try again in a moment');
            }
            if (!videos.length)
                return void M.reply(`No results found for *${term}*`);
            const top = videos.slice(0, 8);
            let text = `🔎 *YouTube Results for "${term}"*\n\n`;
            for (let i = 0; i < top.length; i++) {
                const v = top[i];
                text += `*${i + 1}.* ${v.title}\n`;
                text += `   👤 ${v.author.name}  ⏱ ${v.duration.timestamp}\n`;
                text += `   🔗 ${v.url}\n\n`;
            }
            text += `_Use !ytaudio or !ytvideo with a URL to download_`;
            yield this.client.sock
                .sendMessage(M.from, {
                text,
                contextInfo: {
                    externalAdReply: {
                        title: top[0].title.slice(0, 60),
                        body: `${top[0].author.name} • ${top[0].duration.timestamp}`,
                        mediaType: 2,
                        thumbnailUrl: top[0].thumbnail,
                        mediaUrl: top[0].url,
                        sourceUrl: top[0].url
                    }
                }
            }, { quoted: M.WAMessage })
                .catch(() => M.reply(text));
        });
    }
}
exports.default = Command;
