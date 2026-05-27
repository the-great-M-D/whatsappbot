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
const EVAL_TIMEOUT_MS = 5000;
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'eval',
            description: 'Evaluates JavaScript (dev only)',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}eval [JS code]`,
            devOnly: true,
            baseXp: 0
        });
        this.run = (M, parsedArgs) => __awaiter(this, void 0, void 0, function* () {
            const code = parsedArgs.joined.trim();
            if (!code)
                return void M.reply('No code provided');
            console.log(`[Eval] ${M.sender.jid} → ${code.slice(0, 200)}`);
            let out;
            try {
                const result = yield Promise.race([
                    Promise.resolve().then(() => eval(code)),
                    new Promise((_, reject) => setTimeout(() => reject(new Error(`Eval timed out after ${EVAL_TIMEOUT_MS}ms`)), EVAL_TIMEOUT_MS))
                ]);
                out = result !== undefined ? JSON.stringify(result, null, 2) : 'Executed successfully (no return value)';
            }
            catch (err) {
                out = `❌ ${err.message}`;
            }
            return void (yield M.reply(out.slice(0, 4000)));
        });
    }
}
exports.default = Command;
