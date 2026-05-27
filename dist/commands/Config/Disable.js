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
            command: 'disable',
            description: 'Disables the given command from being used globally',
            category: 'config',
            dm: true,
            usage: `${client.config.prefix}config [command] | (reason)`,
            modsOnly: true,
            baseXp: 0
        });
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { joined }) {
            const split = joined.split('|');
            const key = split[0].toLowerCase().trim();
            if (!key)
                return void (yield M.reply(`Provide the command you want to disable`));
            const feature = key === 'chatbot' ? key : '';
            if (feature) {
                const data = yield this.client.getFeatures(feature);
                if (!data)
                    return void M.reply(`🟨 *${this.client.util.capitalize(feature)}* is already *inactive*`);
                yield this.client.DB.feature.updateOne({ feature: feature }, { $set: { ['state']: false } }).catch(() => {
                    return void M.reply(`🟨 *${this.client.util.capitalize(feature)}* could not be disabled`);
                });
                this.client.features.set('chatbot', false);
                return void M.reply(`🟩 *${this.client.util.capitalize(feature)}* is now inactive`);
            }
            const command = this.handler.commands.get(key) || this.handler.aliases.get(key);
            if (!command)
                return void (yield M.reply(`No command found`));
            if (yield this.client.DB.disabledcommands.findOne({ command: command.config.command }))
                return void M.reply(`${command.config.command} is already disabled`);
            yield new this.client.DB.disabledcommands({
                command: command.config.command,
                reason: (split[1] || '').trim() || ''
            }).save();
            yield M.reply(`*${this.client.util.capitalize(command.config.command)}* is now Disabled${split[1] ? ` for ${split[1]}` : ''}`);
        });
    }
}
exports.default = Command;
