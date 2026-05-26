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
const fs_extra_1 = require("fs-extra");
const BaseCommand_1 = __importDefault(require("../../lib/BaseCommand"));
const MongoAuthState_1 = require("../../lib/MongoAuthState");
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'killswitch',
            description: 'Wipes auth, session and DB records then forces a re-pair',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}killswitch`,
            modsOnly: true,
            baseXp: 0
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            yield M.reply('🔴 *KILLSWITCH ACTIVATED*\nClearing auth, session and database records...');
            const authDir = `auth/${this.client.config.session}`;
            try {
                yield (0, fs_extra_1.remove)(authDir);
            }
            catch ( /* ignore if already gone */_a) { /* ignore if already gone */ }
            if (this.client.DB.connected) {
                yield (0, MongoAuthState_1.clearAuthFromDB)(this.client.DB.session);
                try {
                    yield this.client.DB.session.deleteMany({});
                }
                catch ( /* ignore */_b) { /* ignore */ }
            }
            yield M.reply('✅ Auth and session wiped.\n♻️ Reconnecting — you will need to re-pair the bot.');
            setTimeout(() => {
                this.client.emit('killswitch');
            }, 2000);
        });
    }
}
exports.default = Command;
