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
const wa_sticker_formatter_1 = require("wa-sticker-formatter");
const BaseCommand_1 = __importDefault(require("../../lib/BaseCommand"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'sticker',
            aliases: ['s'],
            description: 'Converts images/videos into stickers',
            category: 'media',
            usage: `${client.config.prefix}sticker [(as caption | tag)[video | image]]`,
            baseXp: 30
        });
        this.run = (M, parsedArgs) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            let buffer;
            if ((_c = (_b = (_a = M.quoted) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.imageMessage)
                buffer = yield this.client.downloadMediaMessage(M.quoted.message);
            else if ((_d = M.WAMessage.message) === null || _d === void 0 ? void 0 : _d.imageMessage)
                buffer = yield this.client.downloadMediaMessage(M.WAMessage);
            else if ((_g = (_f = (_e = M.quoted) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.videoMessage)
                // return void M.reply(`*Gif/Video to Sticker* feature is currently unavailable.\nYou can still use Image to Sticker though!!`)
                buffer = yield this.client.downloadMediaMessage(M.quoted.message);
            else if ((_h = M.WAMessage.message) === null || _h === void 0 ? void 0 : _h.videoMessage)
                // return void M.reply(`*Gif/Video to Sticker* feature is currently unavailable.\nYou can still use Image to Sticker though!!`)
                buffer = yield this.client.downloadMediaMessage(M.WAMessage);
            if (!buffer)
                return void M.reply(`You didn't provide any Image/Video to convert`);
            const getQuality = () => {
                const qualityFlag = parsedArgs.joined.match(/--(\d+)/g) || '';
                return qualityFlag.length
                    ? parseInt(qualityFlag[0].split('--')[1], 10)
                    : parsedArgs.flags.includes('--broke')
                        ? 1
                        : parsedArgs.flags.includes('--low')
                            ? 10
                            : parsedArgs.flags.includes('--high')
                                ? 100
                                : 50;
            };
            let quality = getQuality();
            if (quality > 100 || quality < 1)
                quality = 50;
            parsedArgs.flags.forEach((flag) => (parsedArgs.joined = parsedArgs.joined.replace(flag, '')));
            const getOptions = () => {
                const pack = parsedArgs.joined.split('|');
                const categories = (() => {
                    const categories = parsedArgs.flags.reduce((categories, flag) => {
                        switch (flag) {
                            case '--angry':
                                categories.push('💢');
                                break;
                            case '--love':
                                categories.push('💕');
                                break;
                            case '--sad':
                                categories.push('😭');
                                break;
                            case '--happy':
                                categories.push('😂');
                                break;
                            case '--greet':
                                categories.push('👋');
                                break;
                            case '--celebrate':
                                categories.push('🎊');
                                break;
                        }
                        return categories;
                    }, new Array());
                    categories.length = 2;
                    if (!categories[0])
                        categories.push('❤', '🌹');
                    return categories;
                })();
                return {
                    categories,
                    pack: pack[1] || '🤹‍♂️ Just For You 🤹‍♂️',
                    author: pack[2] || 'By the Codding Family ft M_D"s Bot 🤹‍♂️',
                    quality,
                    type: wa_sticker_formatter_1.StickerTypes[parsedArgs.flags.includes('--crop') || parsedArgs.flags.includes('--c')
                        ? 'CROPPED'
                        : parsedArgs.flags.includes('--stretch') || parsedArgs.flags.includes('--s')
                            ? 'DEFAULT'
                            : 'FULL']
                };
            };
            parsedArgs.flags.forEach((flag) => (parsedArgs.joined = parsedArgs.joined.replace(flag, '')));
            if (!buffer)
                return void M.reply(`You didn't provide any Image/Video to convert`);
            const sticker = yield new wa_sticker_formatter_1.Sticker(buffer, getOptions()).build().catch(() => null);
            if (!sticker)
                return void M.reply(`An Error Occurred While Converting`);
            yield M.reply(sticker, baileys_1.MessageType.sticker, baileys_1.Mimetype.webp);
        });
    }
}
exports.default = Command;
