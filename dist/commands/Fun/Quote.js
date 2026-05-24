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
            command: 'quote',
            description: 'random quote.',
            aliases: ['qu'],
            category: 'fun',
            usage: `${client.config.prefix}quote`,
            baseXp: 30
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            // load JSON
            const quotes = JSON.parse(this.client.assets.get('quotes').toString());
            if (!quotes)
                return void null;
            // select a random quote
            const quote = quotes.quotes[Math.floor(Math.random() * quotes.quotes.length)];
            const text = `📝 *Content:* ${quote.content}\n\n*✍️ Author:* ${quote.author}`;
            M.reply(text);
        });
    }
}
exports.default = Command;
