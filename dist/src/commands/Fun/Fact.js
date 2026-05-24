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
            command: 'fact',
            description: 'sends a random fact for you.',
            aliases: ['facts'],
            category: 'fun',
            usage: `${client.config.prefix}fact`,
            baseXp: 30
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            yield axios_1.default
                .get(`https://nekos.life/api/v2/fact`)
                .then((response) => {
                // console.log(response);
                const text = `📝 *Fact:* ${response.data.fact}`;
                M.reply(text);
            })
                .catch((err) => {
                M.reply(`🔍 Error: ${err}`);
            });
        });
    }
}
exports.default = Command;
