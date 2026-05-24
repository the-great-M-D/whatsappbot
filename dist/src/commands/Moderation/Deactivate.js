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
const WAClient_1 = require("../../lib/WAClient");
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            adminOnly: true,
            command: 'deactivate',
            aliases: ['deact'],
            description: 'deactivate certain features on group-chats',
            category: 'moderation',
            usage: `${client.config.prefix}deactivate [events | mod | safe | nsfw | cmd | invitelink]`,
            baseXp: 0
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            const type = joined.trim().toLowerCase();
            if (!Object.values(WAClient_1.toggleableGroupActions).includes(type))
                return void M.reply(`🟥 Invalid Option: *${this.client.util.capitalize(type)}*`);
            const data = yield this.client.getGroupData(M.from);
            if (!data[type])
                return void M.reply(`🟨 *${this.client.util.capitalize(type)}* is already *inactive*`);
            yield this.client.DB.group.updateOne({ jid: M.from }, { $set: { [type]: false } });
            return void M.reply(`🟩 *${this.client.util.capitalize(type)}* is now inactive`);
        });
    }
}
exports.default = Command;
