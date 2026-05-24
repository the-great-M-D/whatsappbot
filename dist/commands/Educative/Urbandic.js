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
            command: 'urbandictionary',
            aliases: ['ur'],
            description: 'Gives you the definition of the given word. ',
            category: 'educative',
            usage: `${client.config.prefix}ur [Word you want to search about]`,
            baseXp: 50
        });
        this.run = (M, { joined }) => __awaiter(this, void 0, void 0, function* () {
            if (!joined)
                return void M.reply('Please provide a word .');
            const term = joined.trim();
            console.log(term, joined);
            yield axios_1.default
                .get(`http://api.urbandictionary.com/v0/define?term=${term}`)
                .then((response) => {
                // console.log(response);
                const text = `📚 *urban dictionary :* ${term}\n\n📖 *Definition :* ${response.data.list[0].definition.replace(/\[/g, '').replace(/\]/g, '')}\n\n💬 *Example :* ${response.data.list[0].example.replace(/\[/g, '').replace(/\]/g, '')}`;
                M.reply(text);
            })
                .catch((err) => {
                M.reply(`Sorry, couldn't find any definations related to *${term}*.`);
            });
        });
    }
}
exports.default = Command;
