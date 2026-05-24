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
/* eslint-disable @typescript-eslint/no-explicit-any */
const baileys_1 = require("@adiwajshing/baileys");
const BaseCommand_1 = __importDefault(require("../../lib/BaseCommand"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'retrieve',
            description: 'retrieve viewOnceMessage WhatsApp Message',
            category: 'media',
            usage: `${client.config.prefix}retrieve [Tag the viewOnceMessage]`,
            baseXp: 10
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            if (!M.quoted)
                return void (yield M.reply(`Quote the "viewOnceMessage" you want to retrieve`));
            if (!((_e = (_d = (_c = (_b = (_a = M === null || M === void 0 ? void 0 : M.quoted) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.viewOnceMessage) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.videoMessage) &&
                !((_h = (_g = ((_f = M.quoted.message) === null || _f === void 0 ? void 0 : _f.message).viewOnceMessage) === null || _g === void 0 ? void 0 : _g.message) === null || _h === void 0 ? void 0 : _h.imageMessage))
                return void M.reply('Quote the "viewOnceMessage" that you want to retrieve');
            return void M.reply(yield this.client.downloadMediaMessage(((_j = M.quoted.message) === null || _j === void 0 ? void 0 : _j.message).viewOnceMessage), baileys_1.MessageType[((_m = (_l = ((_k = M.quoted.message) === null || _k === void 0 ? void 0 : _k.message).viewOnceMessage) === null || _l === void 0 ? void 0 : _l.message) === null || _m === void 0 ? void 0 : _m.imageMessage) ? 'image' : 'video'], undefined, undefined, 'Abracadabra, 🤹 Open sesame, this message is now public property... M_D"s Bot 🤹');
        });
    }
}
exports.default = Command;
