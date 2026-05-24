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
            command: 'everyone',
            description: 'Tags all users in group chat',
            aliases: ['all', 'tagall'],
            category: 'general',
            usage: `${client.config.prefix}everyone`,
            adminOnly: true,
            baseXp: 20
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            return void (yield M.reply(`${((_a = M.groupMetadata) === null || _a === void 0 ? void 0 : _a.subject) || '*EVERYONE*'}\n*🤹‍♂️ READ QUOTED MESSAGE 🤹‍♂️*\n*[TAGGED MAGICALLY]* \n*M_D BOT 🤹‍♂️*`, undefined, undefined, (_b = M.groupMetadata) === null || _b === void 0 ? void 0 : _b.participants.map((user) => user.jid)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ).catch((reason) => M.reply(`an error occurred, Reason: ${reason}`)));
        });
    }
}
exports.default = Command;
