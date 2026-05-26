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
            command: 'revoke',
            description: 'Revokes the group link.',
            category: 'moderation',
            usage: `${client.config.prefix}revoke`,
            baseXp: 0
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.client.isBotAdmin(((_a = M.groupMetadata) === null || _a === void 0 ? void 0 : _a.admins) || []))
                return void M.reply("I can't revoke the group link without being an admin 🤹‍♂️");
            yield this.client.revokeInvite(M.from).catch(() => {
                return void M.reply('Failed to revoke the group link');
            });
            return void M.reply('Group link revoked 🤹‍♂️');
        });
    }
}
exports.default = Command;
