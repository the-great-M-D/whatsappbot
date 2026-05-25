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
            command: 'delete',
            description: 'Deletes the quoted Message',
            aliases: ['del'],
            category: 'general',
            usage: `${client.config.prefix}delete`,
            baseXp: 0
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (!((_a = M === null || M === void 0 ? void 0 : M.quoted) === null || _a === void 0 ? void 0 : _a.message))
                return void M.reply('Quote the message you want to delete');
            if (M.quoted.sender !== this.client.user.jid)
                return void M.reply(`I can only delete the messages sent by me`);
            // TODO : if the quoted message of the quoted message is sent by the user, delete it
            yield this.client.deleteMessage(M.from, {
                id: ((_c = (_b = M.quoted.message) === null || _b === void 0 ? void 0 : _b.key) === null || _c === void 0 ? void 0 : _c.id) || ((_d = M.quoted.message) === null || _d === void 0 ? void 0 : _d.stanzaId),
                remoteJid: M.from,
                fromMe: true
            });
        });
    }
}
exports.default = Command;
