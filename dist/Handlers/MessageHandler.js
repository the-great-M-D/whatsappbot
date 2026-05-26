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
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = require("path");
class MessageHandler {
    constructor(client) {
        this.client = client;
        this.commands = new Map();
        this.aliases = new Map();
        this.handleMessage = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            console.log(`[HANDLER] from=${M.from} chat=${M.chat} fromMe=${M.WAMessage.key.fromMe} content=${String(M.content).slice(0, 60)}`);
            if (M.WAMessage.key.fromMe) {
                if (M.chat !== 'dm') {
                    M.sender.jid = this.client.botJid;
                    M.sender.username = ((_a = this.client.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = this.client.user) === null || _b === void 0 ? void 0 : _b.vname) || ((_c = this.client.user) === null || _c === void 0 ? void 0 : _c.short) || 'Kaoi Bot';
                }
                else {
                    return void null;
                }
            }
            if (M.from.includes('status'))
                return void null;
            const { args, groupMetadata, sender } = M;
            if (M.chat === 'dm' && this.client.isFeature('chatbot')) {
                if (this.client.config.chatBotUrl) {
                    const myUrl = new URL(this.client.config.chatBotUrl);
                    const params = myUrl.searchParams;
                    yield axios_1.default
                        .get(`${encodeURI(`http://api.brainshop.ai/get?bid=${params.get('bid')}&key=${params.get('key')}&uid=${M.sender.jid}&msg=${M.args}`)}`)
                        .then((res) => {
                        if (res.status !== 200)
                            return void M.reply(`🔍 Error: ${res.status}`);
                        return void M.reply(res.data.cnt);
                    })
                        .catch(() => {
                        M.reply(`Ummmmmmmmm.`);
                    });
                }
            }
            if (M.chat !== 'dm' && !M.from.endsWith('@g.us'))
                return void null;
            if ((yield this.client.getGroupData(M.from)).mod && ((_e = (_d = M.groupMetadata) === null || _d === void 0 ? void 0 : _d.admins) === null || _e === void 0 ? void 0 : _e.includes(this.client.botJid)))
                this.moderate(M);
            if (!args[0] || !args[0].startsWith(this.client.config.prefix))
                return void this.client.log(`${chalk_1.default.blueBright('MSG')} from ${chalk_1.default.green(sender.username)} in ${chalk_1.default.cyanBright((groupMetadata === null || groupMetadata === void 0 ? void 0 : groupMetadata.subject) || '')}`);
            const cmd = args[0].slice(this.client.config.prefix.length).toLowerCase();
            const allowedCommands = ['activate', 'deactivate', 'act', 'deact'];
            if (!(allowedCommands.includes(cmd) || (yield this.client.getGroupData(M.from)).cmd))
                return void this.client.log(`${chalk_1.default.green('CMD')} ${chalk_1.default.yellow(`${args[0]}[${args.length - 1}]`)} from ${chalk_1.default.green(sender.username)} in ${chalk_1.default.cyanBright((groupMetadata === null || groupMetadata === void 0 ? void 0 : groupMetadata.subject) || 'DM')}`);
            const command = this.commands.get(cmd) || this.aliases.get(cmd);
            this.client.log(`${chalk_1.default.green('CMD')} ${chalk_1.default.yellow(`${args[0]}[${args.length - 1}]`)} from ${chalk_1.default.green(sender.username)} in ${chalk_1.default.cyanBright((groupMetadata === null || groupMetadata === void 0 ? void 0 : groupMetadata.subject) || 'DM')}`);
            if (!command)
                return void M.reply('No Command Found! Try using one from the help list.');
            const user = yield this.client.getUser(M.sender.jid);
            if (user.ban)
                return void M.reply("You're Banned from using commands.");
            const state = yield this.client.DB.disabledcommands.findOne({ command: command.config.command });
            if (state)
                return void M.reply(`❌ This command is disabled${state.reason ? ` for ${state.reason}` : ''}`);
            if (!((_f = command.config) === null || _f === void 0 ? void 0 : _f.dm) && M.chat === 'dm')
                return void M.reply('This command can only be used in groups');
            if ((_g = command.config) === null || _g === void 0 ? void 0 : _g.devOnly) {
                const devJid = (_h = this.client.config.mods) === null || _h === void 0 ? void 0 : _h[0];
                if (!devJid || M.sender.jid !== devJid)
                    return void M.reply(`Only the bot developer can use this command`);
            }
            if ((_j = command.config) === null || _j === void 0 ? void 0 : _j.modsOnly) {
                console.log(`[MOD CHECK] senderJid=${M.sender.jid} mods=${JSON.stringify(this.client.config.mods)}`);
                if (!((_k = this.client.config.mods) === null || _k === void 0 ? void 0 : _k.includes(M.sender.jid)))
                    return void M.reply(`Only MODS are allowed to use this command`);
            }
            if ((_l = command.config) === null || _l === void 0 ? void 0 : _l.adminOnly) {
                console.log(`[ADMIN CHECK] senderJid=${M.sender.jid} isAdmin=${M.sender.isAdmin} admins=${JSON.stringify((_m = M.groupMetadata) === null || _m === void 0 ? void 0 : _m.admins)}`);
                if (!M.sender.isAdmin)
                    return void M.reply(`Only admins are allowed to use this command`);
            }
            try {
                yield command.run(M, this.parseArgs(args));
                this.client.emit('command-executed', {
                    command: command.config.command,
                    sender: sender.username || sender.jid.split('@')[0],
                    group: (groupMetadata === null || groupMetadata === void 0 ? void 0 : groupMetadata.subject) || null
                });
                if (command.config.baseXp) {
                    yield this.client.setXp(M.sender.jid, command.config.baseXp || 10, 50);
                }
            }
            catch (err) {
                this.client.log(`[CMD ERROR] ${command.config.command}: ${err.message}`, true);
                console.error('[CMD ERROR STACK]', err);
                try {
                    yield M.reply(`❌ Error: ${err.message}`);
                }
                catch ( /* ignore */_o) { /* ignore */ }
            }
        });
        this.moderate = (M) => __awaiter(this, void 0, void 0, function* () {
            if (M.sender.isAdmin)
                return void null;
            if (M.urls.length) {
                const groupinvites = M.urls.filter((url) => url.includes('chat.whatsapp.com'));
                if (groupinvites.length) {
                    groupinvites.forEach((invite) => __awaiter(this, void 0, void 0, function* () {
                        var _p;
                        const splitInvite = invite.split('/');
                        const z = yield this.client.groupInviteCode(M.from);
                        if (z !== splitInvite[splitInvite.length - 1]) {
                            this.client.log(`${chalk_1.default.blueBright('MOD')} ${chalk_1.default.green('Group Invite')} by ${chalk_1.default.yellow(M.sender.username)} in ${((_p = M.groupMetadata) === null || _p === void 0 ? void 0 : _p.subject) || ''}`);
                            return void (yield this.client.groupRemove(M.from, [M.sender.jid]));
                        }
                    }));
                }
            }
        });
        this.loadCommands = () => {
            this.client.log(chalk_1.default.green('Loading Commands...'));
            const path = (0, path_1.join)(__dirname, '..', 'commands');
            const files = this.client.util.readdirRecursive(path);
            files.map((file) => {
                const filename = file.split('/');
                if (!filename[filename.length - 1].startsWith('_')) {
                    const command = new (require(file).default)(this.client, this);
                    this.commands.set(command.config.command, command);
                    if (command.config.aliases)
                        command.config.aliases.forEach((alias) => this.aliases.set(alias, command));
                    this.client.log(`Loaded: ${chalk_1.default.green(command.config.command)}`);
                    return command;
                }
            });
            this.client.log(`Successfully Loaded ${chalk_1.default.greenBright(this.commands.size)} Commands`);
        };
        this.loadFeatures = () => {
            this.client.log(chalk_1.default.green('Loading Features...'));
            this.client.setFeatures().then(() => {
                this.client.log(`Successfully Loaded ${chalk_1.default.greenBright(this.client.features.size)} Features`);
            });
        };
        this.parseArgs = (args) => {
            const slicedArgs = args.slice(1);
            return {
                args: slicedArgs,
                flags: slicedArgs.filter((arg) => arg.startsWith('--')),
                joined: slicedArgs.join(' ').trim()
            };
        };
    }
}
exports.default = MessageHandler;
