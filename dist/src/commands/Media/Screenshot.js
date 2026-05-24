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
const baileys_1 = require("@adiwajshing/baileys");
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'screenshot',
            aliases: ['ss', 'ssweb'],
            description: 'Gives you the screenshot of the given url. ',
            category: 'media',
            usage: `${client.config.prefix}screenshot [url]`,
            baseXp: 30
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            if (!joined)
                return void (yield M.reply(`🙋 Please provide the url to the site `));
            const url = joined.trim();
            return void M.reply(yield request_1.default.buffer(`https://shot.screenshotapi.net/screenshot?&url=${url}&full_page=true&extract_text=true&fresh=true&width=600&height=500&output=image&file_type=png&thumbnail_width=3000&extract_html=true&wait_for_event=load`), baileys_1.MessageType.image, undefined, undefined, `🌟🤹 Here you go.\n`, undefined).catch((reason) => M.reply(`✖ An error occurred. Please try again later. ${reason}`));
        });
    }
}
exports.default = Command;
