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
            description: 'Posts text, image, or video as a WhatsApp status',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}status [text] — or tag an image/video`,
            devOnly: true,
            baseXp: 30
        });
        this.run = (M, parsedArgs) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            parsedArgs.flags.forEach((flag) => (parsedArgs.joined = parsedArgs.joined.replace(flag, '').trim()));
            // Build statusJidList from known contacts (required by Baileys v7)
            const statusJidList = Object.keys(this.client.contacts).filter(j => j.endsWith('@s.whatsapp.net'));
            const sendOpts = { statusJidList };
            try {
                // Quoted image
                if ((_c = (_b = (_a = M.quoted) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.imageMessage) {
                    yield M.reply('⭐ Posting image status…');
                    const buffer = yield this.client.downloadMediaMessage(M.quoted.message);
                    const caption = parsedArgs.joined || '';
                    yield this.client.sock.sendMessage('status@broadcast', { image: buffer, caption }, sendOpts);
                    return void (yield M.reply('✅ Image status posted'));
                }
                // Own image
                if ((_d = M.WAMessage.message) === null || _d === void 0 ? void 0 : _d.imageMessage) {
                    yield M.reply('⭐ Posting image status…');
                    const buffer = yield this.client.downloadMediaMessage(M.WAMessage);
                    const caption = parsedArgs.joined || '';
                    yield this.client.sock.sendMessage('status@broadcast', { image: buffer, caption }, sendOpts);
                    return void (yield M.reply('✅ Image status posted'));
                }
                // Quoted video
                if ((_g = (_f = (_e = M.quoted) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.videoMessage) {
                    yield M.reply('✨ Posting video status…');
                    const buffer = yield this.client.downloadMediaMessage(M.quoted.message);
                    const caption = parsedArgs.joined || '';
                    yield this.client.sock.sendMessage('status@broadcast', { video: buffer, caption }, sendOpts);
                    return void (yield M.reply('✅ Video status posted'));
                }
                // Own video
                if ((_h = M.WAMessage.message) === null || _h === void 0 ? void 0 : _h.videoMessage) {
                    yield M.reply('✨ Posting video status…');
                    const buffer = yield this.client.downloadMediaMessage(M.WAMessage);
                    const caption = parsedArgs.joined || '';
                    yield this.client.sock.sendMessage('status@broadcast', { video: buffer, caption }, sendOpts);
                    return void (yield M.reply('✅ Video status posted'));
                }
                // Quoted text
                if ((_l = (_k = (_j = M.quoted) === null || _j === void 0 ? void 0 : _j.message) === null || _k === void 0 ? void 0 : _k.message) === null || _l === void 0 ? void 0 : _l.conversation) {
                    const text = M.quoted.message.message.conversation;
                    yield M.reply('✨ Posting text status…');
                    yield this.client.sock.sendMessage('status@broadcast', { text }, sendOpts);
                    return void (yield M.reply('✅ Text status posted'));
                }
                // Plain text from args
                const text = parsedArgs.joined;
                if (!text)
                    return void M.reply(`Usage: \`${this.config.usage}\`\nOr tag an image/video with optional caption`);
                yield M.reply('✨ Posting text status…');
                yield this.client.sock.sendMessage('status@broadcast', { text }, sendOpts);
                return void (yield M.reply('✅ Text status posted'));
            }
            catch (err) {
                return void M.reply(`❌ Failed to post status: ${err.message}`);
            }
        });
    }
}
exports.default = Command;
