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
            command: 'weather',
            aliases: ['wthr'],
            description: 'Gives you the weather of the given state or city. ',
            category: 'educative',
            usage: `${client.config.prefix}weather [place_name]`,
            baseXp: 50
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            if (!joined)
                return void M.reply('Please provide me the place name.');
            const place = joined.trim();
            yield fetch(`http://api.openweathermap.org/data/2.5/weather?q=${place}&units=metric&appid=${process.env.OPENWEATHER_API_KEY || '060a6bcfa19809c2cd4d97a212b19273'}&language=tr`)
                .then((r) => r.json())
                .then((data) => {
                const text = `🔎 Weather for the place *${place}* found\n\n🌸 *Place:* ${data.name}\n*💮 Country:* ${data.sys.country}\n🌈 *Weather:* ${data.weather[0].description}\n🌡️ *Temperature:* ${data.main.temp}°C\n❄️ *Minimum Temperature:* ${data.main.temp_min}°C\n📛 *Maximum Temperature:* ${data.main.temp_max}°C\n💦 *Humidity:* ${data.main.humidity}%\n🎐 *Wind:* ${data.wind.speed} km/h\n`;
                M.reply(text);
            })
                .catch((err) => {
                M.reply(`Sorry, couldn't find any state or place name related to *${place}*.`);
            });
        });
    }
}
exports.default = Command;
