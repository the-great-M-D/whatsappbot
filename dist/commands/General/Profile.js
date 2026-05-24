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
const baileys_1 = require("@adiwajshing/baileys");
const BaseCommand_1 = __importDefault(require("../../lib/BaseCommand"));
const request_1 = __importDefault(require("../../lib/request"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'profile',
            description: 'Displays user-profile 🌟',
            category: 'general',
            usage: `${client.config.prefix}profile (@tag)`,
            aliases: ['p'],
            baseXp: 30
        });
        this.run = (M) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if ((_a = M.quoted) === null || _a === void 0 ? void 0 : _a.sender)
                M.mentioned.push(M.quoted.sender);
            const user = M.mentioned[0] ? M.mentioned[0] : M.sender.jid;
            let username = user === M.sender.jid ? M.sender.username : '';
            if (!username) {
                const contact = this.client.getContact(user);
                username = contact.notify || contact.vname || contact.name || user.split('@')[0];
            }
            let pfp;
            try {
                pfp = yield this.client.getProfilePicture(user);
            }
            catch (err) {
                M.reply(`Profile Picture not Accessible of ${username}`);
                pfp =
                    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Kawaii_robot_power_clipart.svg/640px-Kawaii_robot_power_clipart.svg.png';
            }
            const data = yield this.client.getUser(user);
            yield M.reply(yield request_1.default.buffer(pfp ||
                'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Kawaii_robot_power_clipart.svg/640px-Kawaii_robot_power_clipart.svg.png'), baileys_1.MessageType.image, undefined, undefined, `🎋 *Username: ${username}*\n\n🎫 *About: ${(yield this.client.getStatus(user)) || 'None'}*\n\n🌟 *XP: ${data.Xp || 0}*\n\n👑 *Admin: ${((_c = (_b = M.groupMetadata) === null || _b === void 0 ? void 0 : _b.admins) === null || _c === void 0 ? void 0 : _c.includes(user)) || false}*\n\n❌ *Ban ${data.ban || false}*`);
        });
    }
}
exports.default = Command;
