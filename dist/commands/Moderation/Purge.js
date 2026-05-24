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
            description: 'Removes all group members',
            category: 'moderation',
            usage: `${client.config.prefix}purge`,
            baseXp: 0
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (!((_b = (_a = M.groupMetadata) === null || _a === void 0 ? void 0 : _a.admins) === null || _b === void 0 ? void 0 : _b.includes(this.client.user.jid)))
                return void M.reply("I can't remove without being an admin");
            if (!this.purgeSet.has(((_c = M.groupMetadata) === null || _c === void 0 ? void 0 : _c.id) || '')) {
                this.addToPurge(((_d = M.groupMetadata) === null || _d === void 0 ? void 0 : _d.id) || '');
                return void M.reply("Are you sure? This will remove everyone from the group chat. Use this command again if you'd like to proceed");
            }
            M.groupMetadata.participants.map((user) => __awaiter(this, void 0, void 0, function* () {
                if (!user.isAdmin)
                    yield this.client.groupRemove(M.from, [user.jid]).catch(() => console.log('Failed to remove users'));
            }));
            // now remove all admins except yourself and the owner
            M.groupMetadata.admins.map((user) => __awaiter(this, void 0, void 0, function* () {
                if (user !== M.sender.jid && user !== this.client.user.jid)
                    yield this.client.groupRemove(M.from, [user]).catch(() => console.log('error removing admin'));
            }));
            yield M.reply('Done!').catch(() => console.log('Failed to send message'));
            this.client.groupLeave(M.from);
        });
        this.purgeSet = new Set();
        this.addToPurge = (id) => __awaiter(this, void 0, void 0, function* () {
            this.purgeSet.add(id);
            setTimeout(() => this.purgeSet.delete(id), 60000);
        });
    }
}
exports.default = Command;
