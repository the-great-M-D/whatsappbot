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
            command: 'void',
            description: 'Displays the info',
            category: 'bots',
            usage: `${client.config.prefix}void`,
            baseXp: 100
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            return void M.reply(`👾 *Void* 👾\n\n🍀 *Description:* A fully Object Oriented WhatsApp bot built with TypeScript\n\n🌐 *URL:* https://github.com/Synthesized-Infinity/Whatsapp-Botto-Void \n`).catch((reason) => M.reply(`an error occurred, Reason: ${reason}`));
        });
    }
}
exports.default = Command;
