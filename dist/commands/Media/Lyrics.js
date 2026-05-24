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
const ultra_lyrics_1 = require("ultra-lyrics");
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'lyrics',
            description: 'Gives you lyrics with song playable on WhatsApp',
            category: 'media',
            aliases: ['ly'],
            usage: `${client.config.prefix}yts [term]`,
            dm: true,
            baseXp: 20
        });
        this.run = (M, { joined }) => __awaiter(this, void 0, void 0, function* () {
            if (!joined)
                return void M.reply('🔎 Provide a search term');
            const term = joined.trim();
            const { videos } = yield (0, yt_search_1.default)(term + ' lyrics song');
            if (!videos || videos.length <= 0)
                return void M.reply(`🤹‍♂️ No Matching videos found for the term *${term}*`);
            const video = videos[0];
            const song = yield (0, ultra_lyrics_1.getSong)(term);
            if (song.error || !song.data)
                return void M.reply(`❌ Could Not find any Matching songs: *${term}*`);
            const { error, data } = yield (0, ultra_lyrics_1.getLyrics)(song.data);
            if (error || !data)
                return void M.reply(`❌ Could Not find any Matching Lyrics: *${song.data.title}*`);
            this.client.sock
                .sendMessage(M.from, {
                text: `*Lyrics of: ${term}*\n\n ${data}`,
                contextInfo: {
                    externalAdReply: {
                        title: `${song.data.artist.name} - ${song.data.title}`,
                        body: video.url,
                        mediaType: 2,
                        thumbnailUrl: video.thumbnail,
                        mediaUrl: video.url
                    },
                    mentionedJid: [M.sender.jid]
                }
            })
                .catch((reason) => M.reply(`❌ an error occurred, Reason: ${reason}`));
        });
    }
}
exports.default = Command;
