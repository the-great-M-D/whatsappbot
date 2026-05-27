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
const jimp_1 = require("jimp");
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'blur',
            description: 'Blurs the given image or pfp',
            category: 'media',
            usage: `${client.config.prefix}blur [(as caption | quote)[image] | @mention]`,
            baseXp: 30
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            var _b, _c, _d, _e, _f, _g;
            const image = yield (((_c = (_b = M.WAMessage) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.imageMessage)
                ? this.client.downloadMediaMessage(M.WAMessage)
                : ((_f = (_e = (_d = M.quoted) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.imageMessage)
                    ? this.client.downloadMediaMessage(M.quoted.message)
                    : M.mentioned[0]
                        ? this.client.getProfilePicture(M.mentioned[0])
                        : this.client.getProfilePicture(((_g = M.quoted) === null || _g === void 0 ? void 0 : _g.sender) || M.sender.jid));
            if (!image)
                return void M.reply(`Couldn't fetch the required Image`);
            const level = joined.trim() || '5';
            const blurLevel = isNaN(parseInt(level)) ? 5 : parseInt(level);
            try {
                const img = Buffer.isBuffer(image)
                    ? yield jimp_1.Jimp.fromBuffer(image)
                    : yield jimp_1.Jimp.read(image);
                img.blur(blurLevel);
                const buffer = yield img.getBuffer('image/png');
                M.reply(buffer, 'image');
            }
            catch (err) {
                M.reply((err === null || err === void 0 ? void 0 : err.message) || `Couldn't blur the image`);
            }
        });
    }
}
exports.default = Command;
