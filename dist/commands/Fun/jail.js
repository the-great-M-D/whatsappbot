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
const axios_1 = __importDefault(require("axios"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'jail',
            description: 'to send people to jail who are horny',
            category: 'fun',
            usage: `${client.config.prefix}jail [(as caption | quote)[image] | @mention]`,
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
            yield axios_1.default.get(`https://some-random-api.ml/canvas/jail?avatar=${image}`)
                .then((response) => {
                M.reply(response.data);
            }).catch((e) => {
                M.reply('sorry couldn\'t send the image');
            });
        });
    }
}
exports.default = Command;
