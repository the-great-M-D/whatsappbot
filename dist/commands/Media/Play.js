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
const YT_1 = __importDefault(require("../../lib/YT"));
const MAX_DURATION = 60 * 10;
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'play',
            description: 'Search and download a song by name',
            category: 'media',
            aliases: ['music'],
            usage: `${client.config.prefix}play [song name]`,
            baseXp: 30
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            if (!joined)
                return void M.reply('🔎 Provide a song name or search term');
            const term = joined.trim();
            yield M.reply(`🔎 Searching for *${term}*...`);
            let videos = [];
            try {
                const result = yield (0, yt_search_1.default)(term);
                videos = result.videos;
            }
            catch (_b) {
                return void M.reply('❌ Search failed — try again in a moment');
            }
            if (!videos.length)
                return void M.reply(`❌ No results found for *${term}*`);
            const video = videos[0];
            const yt = new YT_1.default(video.url, 'audio');
            if (video.duration.seconds > MAX_DURATION)
                return void M.reply(`❌ Track is too long (${video.duration.timestamp}). Max is 10 minutes.\n\nTry a more specific search term.`);
            yield M.reply(`🎵 *${video.title}*\n👤 ${video.author.name}\n⏱ ${video.duration.timestamp}\n\n⏳ Downloading...`);
            try {
                const buffer = yield yt.getBuffer();
                yield this.client.sock.sendMessage(M.from, {
                    audio: buffer,
                    mimetype: 'audio/mpeg',
                    contextInfo: {
                        externalAdReply: {
                            title: video.title.slice(0, 60),
                            body: `${video.author.name} • via Kaoi Bot`,
                            mediaType: 2,
                            thumbnailUrl: video.thumbnail,
                            mediaUrl: video.url,
                            sourceUrl: video.url
                        }
                    }
                }, { quoted: M.WAMessage });
            }
            catch (err) {
                yield M.reply(`❌ Download failed: ${(err === null || err === void 0 ? void 0 : err.message) || 'Unknown error'}`);
            }
        });
    }
}
exports.default = Command;
