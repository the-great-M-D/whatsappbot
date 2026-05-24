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
const baileys_1 = require("@adiwajshing/baileys");
const request_1 = __importDefault(require("../../lib/request"));
const BaseCommand_1 = __importDefault(require("../../lib/BaseCommand"));
const axios_1 = __importDefault(require("axios"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'insta',
            aliases: ['iguser', 'ig'],
            description: 'Get the info of a user from ig ',
            category: 'media',
            dm: true,
            usage: `${client.config.prefix}iguser [name]`
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            if (!joined)
                return void M.reply('Provide the keywords you wanna search, 🤹 !');
            const term = joined.trim();
            console.log(term);
            const { data } = yield axios_1.default.get(`https://api-xcoders.xyz/api/stalk/ig?username=${term}&apikey=LJowCce5Pn`);
            if (data.error)
                return void (yield M.reply('Sorry, couldn\'t find'));
            const buffer = yield request_1.default.buffer(data.result.profile_url).catch((e) => {
                return void M.reply(e.message);
            });
            while (true) {
                try {
                    M.reply(buffer || '🌟 An error occurred. Please try again later', baileys_1.MessageType.image, undefined, undefined, `✔ *_Verified:_* *_${data.result.is_verified}_*\n🗣 *_Private:_* *_${data.result.is_private}_*\n🎛 *_Post Count:_* *_${data.result.posts_count}_*\n🤹 *_Following:_* *_${data.result.following}_*\n🗻 *_Followers:_* *_${data.result.followers}_*\n📖 *_Bio_:* ${data.result.biography}\n📃 *_Fullname:_* *_${data.result.full_name}_*\n🀄 *_Username:_* *_${data.result.username}_*\n`, undefined).catch((e) => {
                        console.log(`This error occurs when an image is sent via M.reply()\n Child Catch Block : \n${e}`);
                        // console.log('Failed')
                        M.reply(`🤹 An error occurred. Please try again later.`);
                    });
                    break;
                }
                catch (e) {
                    // console.log('Failed2')
                    M.reply(`An error occurred. Please try again later.`);
                    console.log(`This error occurs when an image is sent via M.reply()\n Parent Catch Block : \n${e}`);
                }
            }
            return void null;
        });
    }
}
exports.default = Command;
