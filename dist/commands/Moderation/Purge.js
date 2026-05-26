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
            command: 'purge',
            description: 'Removes all non-admin group members, then the bot leaves',
            category: 'moderation',
            adminOnly: true,
            usage: `${client.config.prefix}purge`,
            baseXp: 0
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            if (!M.groupMetadata)
                return void M.reply("Couldn't fetch group info. Try again.");
            if (!this.client.isBotAdmin(M.groupMetadata.admins || []))
                return void M.reply("I need to be an admin to purge the group");
            if (!M.sender.isAdmin)
                return void M.reply("Only admins can use this command");
            const groupId = M.from;
            if (!this.purgeSet.has(groupId)) {
                this.addToPurge(groupId);
                return void M.reply("⚠️ *Are you sure?* This will remove everyone from the group and I will leave.\n\nRun *!purge* again within 60 seconds to confirm.");
            }
            this.purgeSet.delete(groupId);
            const participants = M.groupMetadata.participants || [];
            const admins = M.groupMetadata.admins || [];
            // Remove non-admins first
            const nonAdmins = participants
                .filter(p => !p.isAdmin && p.jid !== this.client.botJid && p.jid !== this.client.botLid);
            for (const p of nonAdmins) {
                yield this.client.groupRemove(groupId, [p.jid]).catch(() => null);
            }
            // Remove admins except the sender and the bot
            const otherAdmins = admins.filter(jid => jid !== M.sender.jid && jid !== this.client.botJid && jid !== this.client.botLid);
            for (const jid of otherAdmins) {
                yield this.client.groupRemove(groupId, [jid]).catch(() => null);
            }
            yield M.reply('✅ Done! Leaving now...').catch(() => null);
            yield this.client.groupLeave(groupId).catch(() => null);
        });
        this.purgeSet = new Set();
        this.addToPurge = (id) => {
            this.purgeSet.add(id);
            setTimeout(() => this.purgeSet.delete(id), 60000);
        };
    }
}
exports.default = Command;
