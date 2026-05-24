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
const BaseCommand_1 = __importDefault(require("../../lib/BaseCommand"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'status',
            description: 'Puts the text as status ',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}status [text] [tag Image/Video]`,
            modsOnly: true,
            baseXp: 30
        });
        this.run = (M, parsedArgs) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            parsedArgs.flags.forEach((flag) => (parsedArgs.joined = parsedArgs.joined.replace(flag, '')));
            const args = parsedArgs.joined.split(',');
            let buffer;
            if ((_c = (_b = (_a = M.quoted) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.imageMessage) {
                M.reply('⭐ Posting Image Status');
                let i = 0;
                while (i < 5) {
                    try {
                        buffer = yield this.client.downloadMediaMessage(M.quoted.message);
                        const caption = args[0] || '';
                        // M.reply(`caption : ${caption}`)
                        return void this.client.sendMessage('status@broadcast', buffer, baileys_1.MessageType.image, {
                            caption
                        });
                    }
                    catch (_r) {
                        i += 1;
                        M.reply('Marker Not Found Error : https://github.com/oliver-moran/jimp/issues/102 ');
                    }
                }
                // this.client.sendMessage('status@broadcast', buffer, MessageType.image)
            }
            else if ((_d = M.WAMessage.message) === null || _d === void 0 ? void 0 : _d.imageMessage) {
                M.reply('Posting Image Status ⭐');
                buffer = yield this.client.downloadMediaMessage(M.WAMessage);
                const caption = args[0] || '';
                // M.reply(`caption : ${caption}`)
                this.client.sendMessage('status@broadcast', buffer, baileys_1.MessageType.image, {
                    caption
                });
                // this.client.sendMessage('status@broadcast', buffer, MessageType.image)
            }
            else if ((_g = (_f = (_e = M.quoted) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.videoMessage) {
                M.reply('Posting Video Status ✨');
                buffer = yield this.client.downloadMediaMessage(M.quoted.message);
                const caption = args[0] || '';
                // M.reply(`caption : ${caption}`)
                this.client.sendMessage('status@broadcast', buffer, baileys_1.MessageType.video, {
                    caption
                });
                // this.client.sendMessage('status@broadcast', buffer, MessageType.video)
            }
            else if ((_h = M.WAMessage.message) === null || _h === void 0 ? void 0 : _h.videoMessage) {
                M.reply('✨ Posting Video Status');
                buffer = yield this.client.downloadMediaMessage(M.WAMessage);
                const caption = args[0] || '';
                // M.reply(`caption : ${caption}`)
                this.client.sendMessage('status@broadcast', buffer, baileys_1.MessageType.video, {
                    caption
                });
                // this.client.sendMessage('status@broadcast', buffer, MessageType.video)
            }
            else if ((_l = (_k = (_j = M.quoted) === null || _j === void 0 ? void 0 : _j.message) === null || _k === void 0 ? void 0 : _k.message) === null || _l === void 0 ? void 0 : _l.conversation) {
                M.reply('✨ Posting Text Status');
                const text = ((_p = (_o = (_m = M.quoted) === null || _m === void 0 ? void 0 : _m.message) === null || _o === void 0 ? void 0 : _o.message) === null || _p === void 0 ? void 0 : _p.conversation) || '';
                const backgroundArgb = args.slice(3).map((arg) => `${parseInt(arg) / 16}${parseInt(arg) % 16}`) || 0x00000000;
                const textArgb = args.slice(3).map((arg) => `${256 - parseInt(arg) / 16}${256 - (parseInt(arg) % 16)}`) || 0xf0f0f0f0;
                M.reply(`backgroundArgb : ${backgroundArgb}\ntextArgb: ${textArgb}`);
                this.client.sendMessage('status@broadcast', {
                    text,
                    backgroundArgb,
                    textArgb
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }, baileys_1.MessageType.extendedText);
            }
            else if (!((_q = M.quoted) === null || _q === void 0 ? void 0 : _q.message)) {
                M.reply('Posting Text Status ✨');
                const text = args[0] || '';
                M.reply(`text : ${text}`);
                // const backgroundArgb = args.slice(3).map((arg) => `${parseInt(arg) / 16}${parseInt(arg) % 16}`) || 0x00000000
                // const textArgb = args.slice(3).map((arg) => `${256 - parseInt(arg) / 16}${256 - (parseInt(arg) % 16)}`) || 0xf0f0f0f0
                this.client.sendMessage('status@broadcast', text, baileys_1.MessageType.extendedText);
                // this.client.sendMessage('status@broadcast', text, MessageType.text)
            }
            else
                M.reply('Use Image/Video via Tagging it or/and use text');
        });
    }
}
exports.default = Command;
