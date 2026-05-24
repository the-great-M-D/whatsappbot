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
const request_1 = __importDefault(require("../../lib/request"));
const Spotify_1 = __importDefault(require("../../lib/Spotify"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'spotify',
            description: 'Downloads given spotify track and sends it as Audio',
            category: 'media',
            usage: `${client.config.prefix}spotify [URL]`,
            baseXp: 20,
            aliases: ['sp']
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            if (!M.urls.length)
                return void M.reply(`🔎 Provide the Spotify Track URL that you want to download`);
            const url = M.urls[0];
            const track = new Spotify_1.default(url);
            const info = yield track.getInfo();
            if (info.error)
                return void M.reply(`⚓ Error Fetching: ${url}. Check if the url is valid and try again`);
            const caption = `🎧 *Title:* ${info.name || ''}\n🎤 *Artists:* ${(info.artists || []).join(',')}\n💽 *Album:* ${info.album_name}\n📆 *Release Date:* ${info.release_date || ''}`;
            M.reply(yield request_1.default.buffer(info === null || info === void 0 ? void 0 : info.cover_url), 'image', undefined, undefined, caption).catch((reason) => M.reply(`❌ an error occurred, Reason: ${reason}`));
            M.reply(yield track.getAudio(), 'audio').catch((reason) => M.reply(`❌ an error occurred, Reason: ${reason}`));
        });
    }
}
exports.default = Command;
