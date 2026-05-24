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
const request_1 = __importDefault(require("../../lib/request"));
const baileys_1 = require("@adiwajshing/baileys");
// import { MessageType, Mimetype } from '@adiwajshing/baileys'
const axios_1 = __importDefault(require("axios"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'ipinfo',
            description: 'Get more information abt an IP address.',
            category: 'dev',
            usage: `${client.config.prefix}ipinfo {term}`,
            baseXp: 30
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            // fetch result of https://waifu.pics/api/sfw/waifu from the API using axios
            const { data } = yield axios_1.default.get('https://ipinfo.io/{term}');
            const buffer = yield request_1.default.buffer(data.url).catch((e) => {
                return void M.reply(e.message);
            });
            while (true) {
                try {
                    M.reply(buffer || 'Could not fetch File Please try again later', baileys_1.MessageType.document, undefined, undefined, `ENJOY MTN BY M_D 🤹.\n`, undefined).catch((e) => {
                        console.log(`This Error occurs when an file is sent via M.reply()\n Child Catch Block : \n${e}`);
                        // console.log('Failed')
                        M.reply(`Could not fetch file. Here's the URL: ${data.url}`);
                    });
                    break;
                }
                catch (e) {
                    // console.log('Failed2')
                    M.reply(`Could not fetch file. Here's the URL : ${data.url}`);
                    console.log(`This Error occurs when an file is sent via M.reply()\n Parent Catch Block : \n${e}`);
                }
            }
            return void null;
        });
    }
}
exports.default = Command;
