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
            command: 'enable',
            description: 'Enables the given command globally',
            category: 'config',
            dm: true,
            usage: `${client.config.prefix}enable [command]`,
            modsOnly: true,
            baseXp: 0
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            const key = joined.toLowerCase().trim();
            if (!key)
                return void (yield M.reply(`Provide the command you want to enable`));
            const feature = key === 'chatbot' ? key : '';
            const command = this.handler.commands.get(key) || this.handler.aliases.get(key);
            if (feature) {
                const data = yield this.client.getFeatures(feature);
                if (data.state)
                    return void M.reply(`🟨 *${this.client.util.capitalize(feature)}* is already *active*`);
                yield this.client.DB.feature.updateOne({ feature: feature }, { $set: { state: true } }).catch(() => {
                    return void M.reply(`🟨 *${this.client.util.capitalize(feature)}* failed to enable`);
                });
                this.client.features.set('chatbot', true);
                return void M.reply(`🟩 *${this.client.util.capitalize(feature)}* is now active M_D Bot 🤹‍♂️`);
            }
            if (!command)
                return void (yield M.reply(`No command found`));
            if (!(yield this.client.DB.disabledcommands.findOne({ command: command.config.command })))
                return void M.reply(`${this.client.util.capitalize(command.config.command)} is already enabled`);
            yield this.client.DB.disabledcommands.deleteOne({ command: command.config.command });
            yield M.reply(`*${this.client.util.capitalize(command.config.command)}* is now Enabled`);
        });
    }
}
exports.default = Command;
