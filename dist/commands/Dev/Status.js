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
                        return void this.client.sock.sendMessage('status@broadcast', { image: buffer, caption });
                    }
                    catch (_r) {
                        i += 1;
                        M.reply('Marker Not Found Error : https://github.com/oliver-moran/jimp/issues/102 ');
                    }
                }
            }
            else if ((_d = M.WAMessage.message) === null || _d === void 0 ? void 0 : _d.imageMessage) {
                M.reply('Posting Image Status ⭐');
                buffer = yield this.client.downloadMediaMessage(M.WAMessage);
                const caption = args[0] || '';
                this.client.sock.sendMessage('status@broadcast', { image: buffer, caption });
            }
            else if ((_g = (_f = (_e = M.quoted) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.videoMessage) {
                M.reply('Posting Video Status ✨');
                buffer = yield this.client.downloadMediaMessage(M.quoted.message);
                const caption = args[0] || '';
                this.client.sock.sendMessage('status@broadcast', { video: buffer, caption });
            }
            else if ((_h = M.WAMessage.message) === null || _h === void 0 ? void 0 : _h.videoMessage) {
                M.reply('✨ Posting Video Status');
                buffer = yield this.client.downloadMediaMessage(M.WAMessage);
                const caption = args[0] || '';
                this.client.sock.sendMessage('status@broadcast', { video: buffer, caption });
            }
            else if ((_l = (_k = (_j = M.quoted) === null || _j === void 0 ? void 0 : _j.message) === null || _k === void 0 ? void 0 : _k.message) === null || _l === void 0 ? void 0 : _l.conversation) {
                M.reply('✨ Posting Text Status');
                const text = ((_p = (_o = (_m = M.quoted) === null || _m === void 0 ? void 0 : _m.message) === null || _o === void 0 ? void 0 : _o.message) === null || _p === void 0 ? void 0 : _p.conversation) || '';
                this.client.sock.sendMessage('status@broadcast', { text });
            }
            else if (!((_q = M.quoted) === null || _q === void 0 ? void 0 : _q.message)) {
                M.reply('Posting Text Status ✨');
                const text = args[0] || '';
                M.reply(`text : ${text}`);
                this.client.sock.sendMessage('status@broadcast', { text });
            }
            else
                M.reply('Use Image/Video via Tagging it or/and use text');
        });
    }
}
exports.default = Command;
