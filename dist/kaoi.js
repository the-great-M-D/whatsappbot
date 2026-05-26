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
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const MessageHandler_1 = __importDefault(require("./Handlers/MessageHandler"));
const WAClient_1 = __importDefault(require("./lib/WAClient"));
const Server_1 = __importDefault(require("./lib/Server"));
const chalk_1 = __importDefault(require("chalk"));
const node_cron_1 = __importDefault(require("node-cron"));
const CallHandler_1 = __importDefault(require("./Handlers/CallHandler"));
const AssetHandler_1 = __importDefault(require("./Handlers/AssetHandler"));
const EventHandler_1 = __importDefault(require("./Handlers/EventHandler"));
const client = new WAClient_1.default({
    name: process.env.NAME || 'M_D BOT',
    session: process.env.SESSION || 'M_D',
    prefix: process.env.PREFIX || '!',
    mods: (process.env.MODS || '').split(',').map((number) => `${number}@s.whatsapp.net`),
    gkey: process.env.GOOGLE_API_KEY || '',
    chatBotUrl: process.env.CHAT_BOT_URL || ''
});
process.on('uncaughtException', (err) => {
    client.log(`${chalk_1.default.bgRed('UncaughtException')} ${err.message}`, true);
});
process.on('unhandledRejection', (reason) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    client.log(`${chalk_1.default.bgRed('UnhandledRejection')} ${msg}`, true);
});
client.log('Starting...');
const messageHandler = new MessageHandler_1.default(client);
const callHandler = new CallHandler_1.default(client);
const assetHandler = new AssetHandler_1.default(client);
const eventHandler = new EventHandler_1.default(client);
messageHandler.loadCommands();
assetHandler.loadAssets();
messageHandler.loadFeatures();
const server = new Server_1.default(Number(process.env.PORT) || 4040, client);
server.setHandler(messageHandler);
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    client.once('open', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const userNum = ((_a = client.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = client.user) === null || _b === void 0 ? void 0 : _b.notify) || ((_d = (_c = client.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.split(':')[0]) || 'unknown';
        client.log(chalk_1.default.green(`Connected to WhatsApp as ${chalk_1.default.blueBright(userNum)}`));
        yield client.saveAuthInfo(client.config.session);
        if (process.env.CRON) {
            if (!node_cron_1.default.validate(process.env.CRON))
                return void client.log(`Invalid Cron String: ${chalk_1.default.bgRedBright(process.env.CRON)}`, true);
            client.log(`Cron Job for clearing all chats is set for ${chalk_1.default.bgGreen(process.env.CRON)}`);
            node_cron_1.default.schedule(process.env.CRON, () => __awaiter(void 0, void 0, void 0, function* () {
                client.log('Clearing All Chats...');
                yield client.modifyAllChats('clear');
                client.log('Cleared all Chats!');
            }));
        }
    }));
    client.on('CB:Call', (call) => __awaiter(void 0, void 0, void 0, function* () {
        var _e;
        if (call.status !== 'offer')
            return;
        const number = call.from;
        client.log(`${chalk_1.default.blue('CALL')} From ${((_e = client.contacts[number]) === null || _e === void 0 ? void 0 : _e.notify) || number}`);
        yield callHandler.rejectCall(number, call.id);
    }));
    client.on('new-message', messageHandler.handleMessage);
    client.on('group-participants-update', eventHandler.handle);
    client.on('killswitch', () => {
        client.log('Killswitch triggered — forcing reconnect for re-pair');
        client.forceReconnect();
    });
    yield client.connect();
});
client.DB.connect().then(() => {
    if (!client.DB.connected) {
        client.log(chalk_1.default.yellow('Running without database — XP, bans and group configs will not persist'));
    }
    start();
});
