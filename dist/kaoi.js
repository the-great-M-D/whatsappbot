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
const mongoose_1 = __importDefault(require("mongoose"));
const chalk_1 = __importDefault(require("chalk"));
const node_cron_1 = __importDefault(require("node-cron"));
const CallHandler_1 = __importDefault(require("./Handlers/CallHandler"));
const AssetHandler_1 = __importDefault(require("./Handlers/AssetHandler"));
const EventHandler_1 = __importDefault(require("./Handlers/EventHandler"));
if (!process.env.MONGO_URI)
    throw new Error('MONGO URL IS NOT PROVIDED');
const client = new WAClient_1.default({
    name: process.env.NAME || 'M_D BOT',
    session: process.env.SESSION || 'M_D',
    prefix: process.env.PREFIX || '!',
    mods: (process.env.MODS || '').split(',').map((number) => `${number}@s.whatsapp.net`),
    gkey: process.env.GOOGLE_API_KEY || '',
    chatBotUrl: process.env.CHAT_BOT_URL || ''
});
client.log('Starting...');
const messageHandler = new MessageHandler_1.default(client);
const callHandler = new CallHandler_1.default(client);
const assetHandler = new AssetHandler_1.default(client);
const eventHandler = new EventHandler_1.default(client);
messageHandler.loadCommands();
assetHandler.loadAssets();
messageHandler.loadFeatures();
const db = mongoose_1.default.connection;
new Server_1.default(Number(process.env.PORT) || 4040, client);
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    client.once('open', () => __awaiter(void 0, void 0, void 0, function* () {
        client.log(chalk_1.default.green(`Connected to WhatsApp as ${chalk_1.default.blueBright(client.user.notify || client.user.vname || client.user.name || client.user.jid.split('@')[0])}`));
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
    client.on('CB:Call', (json) => __awaiter(void 0, void 0, void 0, function* () {
        const isOffer = json[1]['type'] == 'offer';
        const number = `${json[1]['from'].split('@')[0]}@s.whatsapp.net`;
        if (!isOffer)
            return void null;
        client.log(`${chalk_1.default.blue('CALL')} From ${client.contacts[number].notify || number}`);
        yield callHandler.rejectCall(number, json[1].id);
    }));
    client.on('new-message', messageHandler.handleMessage);
    client.on('group-participants-update', eventHandler.handle);
    yield client.connect();
});
mongoose_1.default.set('bufferCommands', false);
mongoose_1.default
    .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    bufferCommands: false
})
    .then(() => {
    client.log(chalk_1.default.green('Connected to Database!'));
    client.getAuthInfo(client.config.session).then((session) => {
        if (session)
            client.loadAuthInfo(session);
        start();
    });
})
    .catch((err) => {
    client.log(chalk_1.default.red(`Database connection failed: ${err.message}`), true);
    client.log(chalk_1.default.yellow('Starting without database — some features may not work'), true);
    start();
});
