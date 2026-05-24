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
            command: 'trigger',
            description: 'Sends the triggered version of you',
            category: 'fun',
            usage: `${client.config.prefix}trigger [tag/caption image | @mention]`,
            baseXp: 10
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            let Canvas, GIFEncoder;
            try {
                Canvas = require('canvas');
                GIFEncoder = require('gifencoder');
            }
            catch (_g) {
                return void M.reply('❌ This command is not available in this environment (canvas not supported).');
            }
            const getImage = (image, timeout = 15) => __awaiter(this, void 0, void 0, function* () {
                const img = yield Canvas.loadImage(image);
                const GIF = new GIFEncoder(256, 310);
                GIF.start();
                GIF.setRepeat(0);
                GIF.setDelay(timeout);
                const canvas = Canvas.createCanvas(256, 310);
                const ctx = canvas.getContext(`2d`);
                const BR = 20;
                const LR = 10;
                for (let i = 0; i < 9; i++) {
                    ctx.clearRect(0, 0, 256, 310);
                    ctx.drawImage(img, Math.floor(Math.random() * BR) - BR, Math.floor(Math.random() * BR) - BR, 256 + BR, 310 - 54 + BR);
                    ctx.fillStyle = `#FF000033`;
                    ctx.fillRect(0, 0, 256, 310);
                    ctx.drawImage(yield Canvas.loadImage(this.client.assets.get('triggered') || Buffer.from('')), Math.floor(Math.random() * LR) - LR, 310 - 54 + Math.floor(Math.random() * LR) - LR, 256 + LR, 54 + LR);
                    GIF.addFrame(ctx);
                }
                GIF.finish();
                return GIF.out.getData();
            });
            try {
                const image = yield (((_b = (_a = M.WAMessage) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.imageMessage)
                    ? this.client.downloadMediaMessage(M.WAMessage)
                    : ((_e = (_d = (_c = M.quoted) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.imageMessage)
                        ? this.client.downloadMediaMessage(M.quoted.message)
                        : ((_f = M.quoted) === null || _f === void 0 ? void 0 : _f.sender)
                            ? this.client.getProfilePicture(M.quoted.sender)
                            : M.mentioned
                                ? this.client.getProfilePicture(M.mentioned[0])
                                : this.client.getProfilePicture(M.sender.jid));
                const { Sticker } = require('wa-sticker-formatter');
                const sticker = new Sticker(yield getImage(image), {
                    pack: `Triggered`,
                    author: M.sender.username || `Kaoi`,
                    type: 'full',
                    categories: ['💢']
                });
                if (!sticker)
                    return void M.reply(`I couldn't find an image to trigger.`);
                return void (yield M.reply(yield sticker.build(), 'sticker'));
            }
            catch (err) {
                console.log(err);
                M.reply(`Couldn't fetch the required Image.\n*Error* : ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
            }
        });
    }
}
exports.default = Command;
