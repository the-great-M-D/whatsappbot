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
            command: 'covid',
            description: 'get the covid-19 info of the current place',
            aliases: ['COVID'],
            category: 'educative',
            usage: `${client.config.prefix}covid [name]`
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            if (!joined)
                return void M.reply('🔎 Provide a place name');
            const term = joined.trim();
            yield axios_1.default.get(`https://api.abirhasan.wtf/covid19/v1?country=${term}`)
                .then((response) => {
                // console.log(response);
                const text = `🦠 Covid Information of the place *${term}* is \n\n 🧪 *TotalTests:* ${response.data.TotalTests} \n 🎗 *ActiveCases:* ${response.data.ActiveCases} \n 🏥 *Confirmed:* ${response.data.Confirmed} \n 😳 *Critical:* ${response.data.Critical} \n ☘ *Recovered:* ${response.data.Recovered} \n 🧫 *NewCases:* ${response.data.NewCases} \n 💀 *NewDeaths:* ${response.data.NewDeaths} \n ✏ *TotalCases:* ${response.data.TotalCases} \n 🚩 *Country:* ${response.data.Country} `;
                M.reply(text);
            })
                .catch(err => {
                M.reply(`🔍 Please provide a valid place name \n Error: ${err}`);
            });
        });
    }
}
exports.default = Command;
