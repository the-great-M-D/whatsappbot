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
const baileys_1 = require("@adiwajshing/baileys");
const BaseCommand_1 = __importDefault(require("../../lib/BaseCommand"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            adminOnly: true,
            command: 'open',
            description: 'Opens the group for all participants.',
            category: 'moderation',
            usage: `${client.config.prefix}open`,
            baseXp: 0
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!((_b = (_a = M.groupMetadata) === null || _a === void 0 ? void 0 : _a.admins) === null || _b === void 0 ? void 0 : _b.includes(this.client.user.jid)))
                return void M.reply("I can't open the group without being an admin");
            if (M.groupMetadata.announce === 'false')
                return void M.reply('Group is already open');
            this.client.groupSettingChange(M.groupMetadata.id, baileys_1.GroupSettingChange.messageSend, false);
        });
    }
}
exports.default = Command;
