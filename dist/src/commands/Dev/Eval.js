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
            command: 'eval',
            description: 'Evaluates JavaScript ➕ ',
            category: 'dev',
            dm: true,
            usage: `${client.config.prefix}eval [JS CODE]`,
            modsOnly: true,
            baseXp: 0
        });
        this.run = (M, parsedArgs) => __awaiter(this, void 0, void 0, function* () {
            let out;
            try {
                const output = eval(parsedArgs.joined) || 'Executed JS Successfully!';
                console.log(output);
                out = JSON.stringify(output);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }
            catch (err) {
                out = err.message;
            }
            return void (yield M.reply(out));
        });
    }
}
exports.default = Command;
