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
            adminOnly: true,
            command: 'add',
            description: 'Adds a participant to the group by number',
            category: 'moderation',
            usage: `${client.config.prefix}add [number]`,
            baseXp: 10
        });
        this.run = (M, parsedArgs) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.client.isBotAdmin(((_a = M.groupMetadata) === null || _a === void 0 ? void 0 : _a.admins) || []))
                return void M.reply(`❌ Make me admin first before using ${this.config.command}`);
            if (!M.sender.isAdmin)
                return void M.reply(`❌ Only admins can add members`);
            const number = parsedArgs.joined.replace(/\D+/g, '').trim();
            if (!number.length)
                return void M.reply(`Please provide the number you want to add`);
            try {
                const onWA = yield this.client.isOnWhatsApp(`${number}@s.whatsapp.net`);
                if (!onWA)
                    return void M.reply(`❌ That number is not on WhatsApp`);
                const result = yield this.client.groupAdd(M.from, [`${number}@s.whatsapp.net`]);
                if (!result)
                    return void M.reply(`❌ Failed to add ${number}`);
                yield M.reply(`✅ Successfully added *${number}*`);
            }
            catch (_b) {
                M.reply(`❌ Something went wrong`);
            }
        });
    }
}
exports.default = Command;
