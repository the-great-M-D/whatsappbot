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
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'ytvideo',
            description: 'Downloads given YT Video',
            category: 'media',
            aliases: ['ytv'],
            usage: `${client.config.prefix}ytv [URL]`,
            baseXp: 10
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            if (!M.urls.length)
                return void M.reply('🔎 Provide the URL of the YT video you want to download');
            const video = new YT_1.default(M.urls[0], 'video');
            if (!video.validateURL())
                return void M.reply(`Provide a Valid YT URL`);
            const { videoDetails } = yield video.getInfo();
            M.reply('🤹 please wait while video is being Downloaded ... it will be sent when ready thanx 🤹‍♂️ ... ✌️');
            if (Number(videoDetails.lengthSeconds) > 1800)
                return void M.reply('✌️ Only Admins can download videos longer than 30 minutes');
            M.reply(yield video.getBuffer(), 'video').catch((reason) => M.reply(`❌ an error occurred, Reason: ${reason}`));
        });
    }
}
exports.default = Command;
