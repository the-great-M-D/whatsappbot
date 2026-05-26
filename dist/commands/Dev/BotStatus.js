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
            command: 'botstatus',
            aliases: ['bs', 'botinfo'],
            description: 'Shows bot runtime stats — uptime, memory, ping, and connection info',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}botstatus`,
            devOnly: true,
            baseXp: 0
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            const pingStart = Date.now();
            yield M.reply('🏓 Pinging...');
            const ping = Date.now() - pingStart;
            const mem = process.memoryUsage();
            const toMB = (b) => (b / 1024 / 1024).toFixed(1);
            const fmtUptime = (ms) => {
                const s = Math.floor(ms / 1000);
                const d = Math.floor(s / 86400);
                const h = Math.floor((s % 86400) / 3600);
                const m = Math.floor((s % 3600) / 60);
                const sec = s % 60;
                if (d > 0)
                    return `${d}d ${h}h ${m}m`;
                if (h > 0)
                    return `${h}h ${m}m ${sec}s`;
                if (m > 0)
                    return `${m}m ${sec}s`;
                return `${sec}s`;
            };
            const botUptime = this.client.connectedAt
                ? fmtUptime(Date.now() - this.client.connectedAt)
                : 'Not connected';
            const processUptime = fmtUptime(process.uptime() * 1000);
            const cmdsLoaded = this.handler.commands.size;
            const user = this.client.user;
            const name = (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.vname) || (user === null || user === void 0 ? void 0 : user.short) || 'Unknown';
            const number = (user === null || user === void 0 ? void 0 : user.id)
                ? user.id.replace(/:(\d+)@/, '@').split('@')[0]
                : 'Unknown';
            const text = [
                `╔══════════════════╗`,
                `║   🤖 *BOT STATUS*   ║`,
                `╚══════════════════╝`,
                ``,
                `*📡 Connection*`,
                `├ Name: ${name}`,
                `├ Number: +${number}`,
                `├ Session: ${this.client.config.session}`,
                `└ Ping: ${ping}ms`,
                ``,
                `*⏱ Uptime*`,
                `├ Bot connected: ${botUptime}`,
                `└ Process running: ${processUptime}`,
                ``,
                `*💾 Memory*`,
                `├ Used: ${toMB(mem.heapUsed)} MB`,
                `├ Total heap: ${toMB(mem.heapTotal)} MB`,
                `└ RSS: ${toMB(mem.rss)} MB`,
                ``,
                `*⚡ Commands*`,
                `└ Loaded: ${cmdsLoaded}`,
                ``,
                `*🛠 Runtime*`,
                `└ Node.js: ${process.version}`,
            ].join('\n');
            return void (yield M.reply(text));
        });
    }
}
exports.default = Command;
