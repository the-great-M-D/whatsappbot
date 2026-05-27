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
const YT_1 = __importDefault(require("../../lib/YT"));
const MAX_DURATION_AUDIO = 60 * 15;
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'ytaudio',
            description: 'Downloads a YouTube video and sends it as audio (MP3)',
            category: 'media',
            aliases: ['yta'],
            usage: `${client.config.prefix}ytaudio [URL]`,
            baseXp: 20
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            if (!M.urls.length)
                return void M.reply('🔎 Send a YouTube URL with this command');
            const yt = new YT_1.default(M.urls[0], 'audio');
            if (!yt.validateURL())
                return void M.reply('⚓ That doesn\'t look like a valid YouTube URL');
            let info;
            try {
                info = yield yt.getInfo();
            }
            catch (_a) {
                return void M.reply('❌ Could not fetch video info — the video may be unavailable or private');
            }
            if (info.lengthSeconds > MAX_DURATION_AUDIO)
                return void M.reply(`❌ Audio must be under 15 minutes (this is ${Math.floor(info.lengthSeconds / 60)}m)`);
            yield M.reply(`🎵 *${info.title}*\n👤 ${info.author}\n⏱ ${Math.floor(info.lengthSeconds / 60)}m ${info.lengthSeconds % 60}s\n\n⏳ Downloading...`);
            try {
                const buffer = yield yt.getBuffer();
                yield M.reply(buffer, 'audio');
            }
            catch (err) {
                yield M.reply(`❌ Download failed: ${(err === null || err === void 0 ? void 0 : err.message) || 'Unknown error'}`);
            }
        });
    }
}
exports.default = Command;
