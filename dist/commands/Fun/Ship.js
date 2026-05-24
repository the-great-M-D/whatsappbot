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
            command: 'ship',
            description: `Ship 💖 People`,
            category: 'fun',
            usage: `${client.config.prefix}ship [tag user]`,
            baseXp: 50
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const percentage = Math.floor(Math.random() * 100);
            let sentence;
            if (percentage < 25) {
                sentence = `\t\t\t\t\t*ShipCent : ${percentage}%* \n\t\tThere's still time to reconsider your choices`;
            }
            else if (percentage < 50) {
                sentence = `\t\t\t\t\t*ShipCent : ${percentage}%* \n\t\t Good enough, I guess! 💫`;
            }
            else if (percentage < 75) {
                sentence = `\t\t\t\t\t*ShipCent : ${percentage}%* \n\t\t\tStay together and you'll find a way ⭐️`;
            }
            else if (percentage < 90) {
                sentence = `\t\t\t\t\t*ShipCent : ${percentage}%* \n\tAmazing! You two will be a good couple 💖 `;
            }
            else {
                sentence = `\t\t\t\t\t*ShipCent : ${percentage}%* \n\tYou two are fated to be together 💙`;
            }
            if (((_a = M.quoted) === null || _a === void 0 ? void 0 : _a.sender) && !M.mentioned.includes(M.quoted.sender))
                M.mentioned.push(M.quoted.sender);
            while (M.mentioned.length < 2)
                M.mentioned.push(M.sender.jid);
            const user1 = M.mentioned[0];
            const user2 = M.mentioned[1];
            const data = JSON.parse((_b = this.client.assets.get('ship')) === null || _b === void 0 ? void 0 : _b.toString());
            const ship = data.shipJson.filter((ship) => {
                const shipPercent = parseInt(ship.shipPercent);
                return Math.abs(shipPercent - percentage) <= 10;
            });
            const gifLink = ship[Math.floor(Math.random() * ship.length)].gifLink;
            let caption = `\t❣️ *Matchmaking...* ❣️ \n`;
            caption += `\t\t---------------------------------\n`;
            caption += `@${user1.split('@')[0]}  x  @${user2.split('@')[0]}\n`;
            caption += `\t\t---------------------------------\n`;
            caption += `${sentence}`;
            return void M.reply(yield this.client.util.GIFBufferToVideoBuffer(yield this.client.getBuffer(gifLink)), 'gif', 'video/mp4', [user1, user2], caption);
        });
    }
}
exports.default = Command;
