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
const axios_1 = __importDefault(require("axios"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'google',
            aliases: ['g', 'search'],
            description: 'Search on the web ',
            category: 'media',
            usage: `${client.config.prefix}google [query]`,
            baseXp: 10
        });
        this.run = (M, { joined }) => __awaiter(this, void 0, void 0, function* () {
            if (!this.client.config.gkey)
                return void M.reply('No google API key set');
            if (!joined)
                return void M.reply('🔎 Provide a search term');
            const term = joined.trim();
            yield axios_1.default
                .get(`https://www.googleapis.com/customsearch/v1?q=${term}&key=${this.client.config.gkey}&cx=baf9bdb0c631236e5`)
                .then((res) => {
                var _a;
                if (res.status !== 200)
                    return void M.reply(`🔍 Error: ${res.status}`);
                let result = ``;
                let index = 1;
                for (const item of (_a = res.data) === null || _a === void 0 ? void 0 : _a.items) {
                    result += `*🤹${index}.Title* : ${item.title}\n*🔗Link* : ${item.link}\n*📖Snippet* : ${item.snippet}\n\n`;
                    index++;
                }
                // return void M.reply(`🔍Command Used : ${Command.count} times\n Result for *${term}*\n\n\n ${result}`)
                return void M.reply(`🔍 Result for *${term}*\n\n\n ${result}`);
            })
                .catch((err) => {
                M.reply(`🔍 Error: ${err}`);
            });
        });
    }
}
exports.default = Command;
