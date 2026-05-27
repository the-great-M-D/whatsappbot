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
            command: 'demote',
            description: 'Demotes the mentioned admins',
            category: 'moderation',
            usage: `${client.config.prefix}demote [mention | @tag]`,
            baseXp: 0
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (!this.client.isBotAdmin(((_a = M.groupMetadata) === null || _a === void 0 ? void 0 : _a.admins) || []))
                return void M.reply(`❌ I need to be an admin to demote members`);
            if (!M.sender.isAdmin)
                return void M.reply(`❌ Only admins can demote members`);
            if ((_b = M.quoted) === null || _b === void 0 ? void 0 : _b.sender)
                M.mentioned.push(M.quoted.sender);
            if (!M.mentioned.length)
                return void M.reply(`Please tag the users you want to demote`);
            for (const user of M.mentioned) {
                const usr = this.client.contacts[user];
                const username = (usr === null || usr === void 0 ? void 0 : usr.notify) || (usr === null || usr === void 0 ? void 0 : usr.vname) || (usr === null || usr === void 0 ? void 0 : usr.name) || user.split('@')[0];
                if (!((_d = (_c = M.groupMetadata) === null || _c === void 0 ? void 0 : _c.admins) === null || _d === void 0 ? void 0 : _d.includes(user))) {
                    yield M.reply(`❌ Skipped *${username}* — not an admin`);
                }
                else if (this.client.isBotAdmin([user])) {
                    yield M.reply(`❌ Skipped *${username}* — can't demote myself`);
                }
                else {
                    yield this.client.groupDemoteAdmin(M.from, [user]).catch(() => null);
                    yield M.reply(`➰ Demoted *${username}*`);
                }
            }
        });
    }
}
exports.default = Command;
