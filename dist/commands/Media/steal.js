"use strict";
/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
/*eslint-disable @typescript-eslint/explicit-module-boundary-types*/
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
const wa_sticker_formatter_1 = require("wa-sticker-formatter");
const BaseCommand_1 = __importDefault(require("../../lib/BaseCommand"));
const fs_1 = __importDefault(require("fs"));
const os_1 = require("os");
class Command extends BaseCommand_1.default {
    exe() {
        throw new Error("Method not implemented.");
    }
    constructor(client, handler) {
        super(client, handler, {
            command: "steal",
            aliases: ["take"],
            description: "Will format the given sticker.",
            category: "media",
            usage: `${client.config.prefix}steal[tag_sticker]|pack|author`,
            baseXp: 30,
        });
        this.run = (M, parsedArgs) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            let buffer;
            if ((_c = (_b = (_a = M.quoted) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.stickerMessage)
                buffer = yield this.client.downloadMediaMessage(M.quoted.message);
            if (!buffer)
                return void M.reply(`Provide a sticker to format, ✌️😁`);
            const pack = parsedArgs.joined.split("|");
            if (!pack[1])
                return void M.reply(`Please provide the new name and author of the sticker.\nExample: ${this.client.config.prefix}steal | By | The Great M_D 🤹‍♂️`);
            const filename = `${(0, os_1.tmpdir)()}/${Math.random().toString(36)}`;
            const getQuality = () => {
                const qualityFlag = parsedArgs.joined.match(/--(\d+)/g) || "";
                return qualityFlag.length
                    ? parseInt(qualityFlag[0].split("--")[1], 10)
                    : parsedArgs.flags.includes("--broke")
                        ? 1
                        : parsedArgs.flags.includes("--low")
                            ? 10
                            : parsedArgs.flags.includes("--high")
                                ? 100
                                : 50;
            };
            let quality = getQuality();
            if (quality > 100 || quality < 1)
                quality = 50;
            parsedArgs.flags.forEach((flag) => (parsedArgs.joined = parsedArgs.joined.replace(flag, "")));
            const getOptions = () => {
                const categories = (() => {
                    const categories = parsedArgs.flags.reduce((categories, flag) => {
                        switch (flag) {
                            case "--angry":
                                categories.push("💢");
                                break;
                            case "--love":
                                categories.push("💕");
                                break;
                            case "--sad":
                                categories.push("😭");
                                break;
                            case "--happy":
                                categories.push("😂");
                                break;
                            case "--greet":
                                categories.push("👋");
                                break;
                            case "--celebrate":
                                categories.push("🎊");
                                break;
                        }
                        return categories;
                    }, new Array());
                    categories.length = 2;
                    if (!categories[0])
                        categories.push("❤", "🌹");
                    return categories;
                })();
                return {
                    categories,
                    pack: pack[1],
                    author: pack[2] || `${M.sender.username}`,
                    quality,
                    type: wa_sticker_formatter_1.StickerTypes[parsedArgs.flags.includes("--crop") ||
                        parsedArgs.flags.includes("--c")
                        ? "CROPPED"
                        : parsedArgs.flags.includes("--stretch") ||
                            parsedArgs.flags.includes("--s")
                            ? "DEFAULT"
                            : "FULL"],
                };
            };
            parsedArgs.flags.forEach((flag) => (parsedArgs.joined = parsedArgs.joined.replace(flag, "")));
            const sticker = yield new wa_sticker_formatter_1.Sticker(buffer, getOptions()).build();
            fs_1.default.writeFileSync(`${filename}.webp`, sticker);
            const stickerbuffer = fs_1.default.readFileSync(`${filename}.webp`);
            yield M.reply(stickerbuffer, 'sticker');
        });
    }
}
exports.default = Command;
