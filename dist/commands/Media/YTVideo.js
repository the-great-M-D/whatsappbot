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
const MAX_DURATION_VIDEO = 60 * 10;
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'ytvideo',
            description: 'Downloads a YouTube video and sends it as MP4 (max 10 min)',
            category: 'media',
            aliases: ['ytv'],
            usage: `${client.config.prefix}ytvideo [URL]`,
            baseXp: 10
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            if (!M.urls.length)
                return void M.reply('🔎 Send a YouTube URL with this command');
            const yt = new YT_1.default(M.urls[0], 'video');
            if (!yt.validateURL())
                return void M.reply('⚓ That doesn\'t look like a valid YouTube URL');
            let info;
            try {
                info = yield yt.getInfo();
            }
            catch (_a) {
                return void M.reply('❌ Could not fetch video info — the video may be unavailable or private');
            }
            if (info.lengthSeconds > MAX_DURATION_VIDEO)
                return void M.reply(`❌ Video is too long (${Math.floor(info.lengthSeconds / 60)}m). Maximum is 10 minutes.\n\nUse *!ytaudio* if you just want the audio.`);
            yield M.reply(`🎬 *${info.title}*\n👤 ${info.author}\n⏱ ${Math.floor(info.lengthSeconds / 60)}m ${info.lengthSeconds % 60}s\n👁 ${info.viewCount} views\n\n⏳ Downloading...`);
            try {
                const buffer = yield yt.getBuffer();
                yield M.reply(buffer, 'video');
            }
            catch (err) {
                yield M.reply(`❌ Download failed: ${(err === null || err === void 0 ? void 0 : err.message) || 'Unknown error'}`);
            }
        });
    }
}
exports.default = Command;
