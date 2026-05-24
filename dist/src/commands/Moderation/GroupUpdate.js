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
            command: 'groupchange',
            description: 'Updates the Group Subject or Description.',
            category: 'moderation',
            aliases: ['gadd', 'gset'],
            usage: `${client.config.prefix}gset (sub/desc) (value)`,
            baseXp: 0
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!((_b = (_a = M.groupMetadata) === null || _a === void 0 ? void 0 : _a.admins) === null || _b === void 0 ? void 0 : _b.includes(this.client.user.jid)))
                return void M.reply('Can not update without being an admin');
            // check if first parameter is subject or description
            if (M.args.length < 2)
                return void M.reply('You need to specify a subject and a value');
            const subject = M.args[1].toLowerCase();
            const value = M.args.slice(2).join(' ');
            if (subject === 'sub' || subject === 'subject') {
                yield this.client
                    .groupUpdateSubject(M.groupMetadata.id, value.toString())
                    .then(() => {
                    return void M.reply('Group subject updated');
                })
                    .catch((e) => {
                    console.error(e);
                    return void M.reply('Error updating subject');
                });
            }
            else if (subject === 'desc' || subject === 'description') {
                yield this.client
                    .groupUpdateDescription(M.groupMetadata.id, value.toString())
                    .then(() => {
                    return void M.reply('Group description updated');
                })
                    .catch((e) => {
                    console.log(e);
                    return void M.reply('Error while updating');
                });
            }
            return;
        });
    }
}
exports.default = Command;
