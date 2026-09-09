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
// @ts-ignore
const lyrics_monarch_api_1 = __importDefault(require("lyrics-monarch-api"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'lyrics',
            description: 'Gives you lyrics with song playable on WhatsApp',
            category: 'media',
            aliases: ['ly'],
            usage: `${client.config.prefix}lyrics [term]`,
            dm: true,
            baseXp: 20
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            if (!joined)
                return void M.reply('🔎 Provide a search term');
            const term = joined.trim();
            const { videos } = yield (0, yt_search_1.default)(term + ' lyrics song');
            if (!videos || videos.length <= 0)
                return void M.reply(`🤹‍♂️ No Matching videos found for the term *${term}*`);
            const video = videos[0];
            const lyricsApi = new lyrics_monarch_api_1.default();
            try {
                const response = yield lyricsApi.getLyrics(term);
                if (!response || !response.data)
                    return void M.reply(`❌ Could Not find any Matching Lyrics: *${term}*`);
                const lyricsText = typeof response.data === 'string' ? response.data : (response.data.lyrics || JSON.stringify(response.data));
                this.client.sock
                    .sendMessage(M.from, {
                    text: `*Lyrics of: ${term}*\n\n ${lyricsText}`,
                    contextInfo: {
                        externalAdReply: {
                            title: `Lyrics: ${term}`,
                            body: video.url,
                            mediaType: 2,
                            thumbnailUrl: video.thumbnail,
                            mediaUrl: video.url,
                            sourceUrl: video.url
                        },
                        mentionedJid: [M.sender.jid]
                    }
                })
                    .catch((reason) => M.reply(`❌ an error occurred, Reason: ${reason}`));
            }
            catch (_b) {
                M.reply(`❌ Could Not find any Matching Lyrics: *${term}*`);
            }
        });
    }
}
exports.default = Command;
