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
            command: 'xp',
            description: "Displays User's Xp 🌟",
            category: 'general',
            usage: `${client.config.prefix}xp (@tag)`,
            aliases: ['exp'],
            baseXp: 10
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if ((_a = M.quoted) === null || _a === void 0 ? void 0 : _a.sender)
                M.mentioned.push(M.quoted.sender);
            const user = M.mentioned[0] ? M.mentioned[0] : M.sender.jid;
            let username = user === M.sender.jid ? M.sender.username : 'Your';
            if (!username) {
                // const contact = this.client.getContact(user)
                // username = contact.notify || contact.vname || contact.name || user.split('@')[0]
                username = user.split('@')[0];
            }
            return void (yield M.reply(`${username} XP: ${(yield this.client.getUser(user)).Xp || 0}`));
        });
    }
}
exports.default = Command;
