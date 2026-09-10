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
        super(client, handler, { command: 'trigger', description: 'Sends the triggered version of you', category: 'fun', usage: `${client.config.prefix}trigger`, baseXp: 10 });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            let Canvas, GIFEncoder;
            try {
                Canvas = require('canvas');
                GIFEncoder = require('gifencoder');
            }
            catch (_g) {
                return void M.reply('This command is not available in this environment.');
            }
            try {
                const image = yield (((_b = (_a = M.WAMessage) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.imageMessage) ? this.client.downloadMediaMessage(M.WAMessage) : ((_e = (_d = (_c = M.quoted) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.imageMessage) ? this.client.downloadMediaMessage(M.quoted.message) : ((_f = M.quoted) === null || _f === void 0 ? void 0 : _f.sender) ? this.client.getProfilePicture(M.quoted.sender) : M.mentioned ? this.client.getProfilePicture(M.mentioned[0]) : this.client.getProfilePicture(M.sender.jid));
                const img = yield Canvas.loadImage(image);
                const gif = new GIFEncoder(256, 310);
                gif.start();
                gif.setRepeat(0);
                gif.setDelay(15);
                const canvas = Canvas.createCanvas(256, 310);
                const ctx = canvas.getContext('2d');
                for (let i = 0; i < 9; i++) {
                    ctx.clearRect(0, 0, 256, 310);
                    ctx.drawImage(img, Math.floor(Math.random() * 20) - 20, Math.floor(Math.random() * 20) - 20, 276, 276);
                    gif.addFrame(ctx);
                }
                gif.finish();
                return void (yield M.reply(gif.out.getData(), 'gif'));
            }
            catch (err) {
                return void M.reply(`Couldn't fetch the required Image.\nError: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            }
        });
    }
}
exports.default = Command;
