"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const baileys_1 = require("@adiwajshing/baileys");
const events_1 = __importDefault(require("events"));
const chess_node_1 = __importStar(require("chess-node"));
const chess_image_generator_ts_1 = __importDefault(require("chess-image-generator-ts"));
class Command extends BaseCommand_1.default {
    constructor(client, handler) {
        super(client, handler, {
            command: 'chess',
            description: 'Play Chess ♟️ on WhatsApp 🤯',
            category: 'games',
            usage: `${client.config.prefix}chess`,
            baseXp: 20
        });
        this.games = new Map();
        this.challenges = new Map();
        this.ongoing = new Set();
        this.parseBoard = (board) => this.client.util
            .chunk(board.map((tile) => {
            if (tile === 'bK')
                return 'k';
            if (tile === 'wK')
                return 'K';
            if (tile === 'wk')
                return 'N';
            if (tile === 'bk')
                return 'n';
            if (tile[0] === 'w')
                return tile[1].toUpperCase();
            return tile[1].toLowerCase();
        }), 8)
            .reverse();
        this.run = (M_1, _a) => __awaiter(this, [M_1, _a], void 0, function* (M, { args }) {
            const end = (winner) => __awaiter(this, void 0, void 0, function* () {
                const game = this.games.get(M.from);
                const challenge = this.challenges.get(M.from);
                if (!game || !challenge)
                    return void null;
                const w = (winner === null || winner === void 0 ? void 0 : winner.endsWith('.net'))
                    ? winner
                    : winner === 'White'
                        ? challenge.challenger
                        : winner === 'Black'
                            ? challenge.challengee
                            : null;
                this.challenges.set(M.from, undefined);
                this.games.set(M.from, undefined);
                this.ongoing.delete(M.from);
                if (!w)
                    return void this.client.sendMessage(M.from, 'Match Ended in a Draw!', baileys_1.MessageType.text);
                yield this.client.setXp(w, 500, 1000);
                if (w)
                    return void this.client.sendMessage(M.from, this.client.assets.get('chess-win') || '', baileys_1.MessageType.video, {
                        caption: `@${w.split('@')[0]} Won! 🎊`,
                        mimetype: baileys_1.Mimetype.gif,
                        contextInfo: { mentionedJid: [w] }
                    });
            });
            const print = (msg) => {
                if (msg === 'Invalid Move' || msg === 'Not your turn')
                    return void M.reply(msg);
                this.client.sendMessage(M.from, msg, baileys_1.MessageType.text);
                if (msg.includes('stalemate'))
                    return void end();
                if (msg.includes('wins')) {
                    const winner = msg.includes('Black wins') ? 'Black' : 'White';
                    return void end(winner);
                }
            };
            if (!args || !args[0])
                return void M.reply(this.client.assets.get('chess-notation') || '', baileys_1.MessageType.image, undefined, undefined, `♟️ *Chess Commands* ♟️\n\n🎗️ *${this.client.config.prefix}chess challenge* - Challenges the mentioned or quoted person to a chess match\n\n🎀 *${this.client.config.prefix}chess accept* - Accpets the challenge if anyone had challenged you\n\n🔰 *${this.client.config.prefix}chess reject* - Rejects the incomming challenge\n\n💝 *${this.client.config.prefix}chess move [fromTile | 'castle'] [toTile]* - Make a move in the match (refer to the image)\n\n🎋 *${this.client.config.prefix}chess ff* - forfits the match`);
            switch (args[0].toLowerCase()) {
                case 'c':
                case 'challenge':
                    const challengee = M.quoted && M.mentioned.length === 0 ? M.quoted.sender : M.mentioned[0] || null;
                    if (!challengee || challengee === M.sender.jid)
                        return void M.reply(`Mention the person you want to challenge`);
                    if (this.ongoing.has(M.from) || this.challenges.get(M.from))
                        return void M.reply('A Chess session is already going on');
                    if (challengee === this.client.user.jid)
                        return void M.reply(`Challenge someone else`);
                    this.challenges.set(M.from, { challenger: M.sender.jid, challengee });
                    return void M.reply(`@${M.sender.jid.split('@')[0]} has Challenged @${challengee.split('@')[0]} to a chess match. Use *${this.client.config.prefix}chess accept* to start the challenge`, baileys_1.MessageType.text, undefined, [challengee || '', M.sender.jid]);
                case 'a':
                case 'accept':
                    const challenge = this.challenges.get(M.from);
                    if ((challenge === null || challenge === void 0 ? void 0 : challenge.challengee) !== M.sender.jid)
                        return void M.reply('No one challenged you to a chess match');
                    this.ongoing.add(M.from);
                    const game = new chess_node_1.default(new events_1.default(), M.from);
                    yield M.reply(`*Chess Game Started!*\n\n⬜ *White:* @${challenge.challenger.split('@')[0]}\n⬛ *Black:* @${challenge.challengee.split('@')[0]}`, baileys_1.MessageType.text, undefined, Object.values(challenge));
                    game.start(print, challenge.challenger, challenge.challengee, () => __awaiter(this, void 0, void 0, function* () {
                        const cig = new chess_image_generator_ts_1.default();
                        cig.loadArray(this.parseBoard(game.board.getPieces(game.white, game.black)));
                        let sent = false;
                        while (!sent) {
                            try {
                                yield cig
                                    .generateBuffer()
                                    .then((data) => __awaiter(this, void 0, void 0, function* () { return yield this.client.sendMessage(M.from, data, baileys_1.MessageType.image); }));
                                sent = true;
                            }
                            catch (err) {
                                continue;
                            }
                        }
                    }));
                    return void this.games.set(M.from, game);
                case 'reject':
                    const ch = this.challenges.get(M.from);
                    if ((ch === null || ch === void 0 ? void 0 : ch.challengee) !== M.sender.jid && (ch === null || ch === void 0 ? void 0 : ch.challenger) !== M.sender.jid)
                        return void M.reply('No one challenged you to a chess match');
                    this.challenges.set(M.from, undefined);
                    return void M.reply(ch.challenger === M.sender.jid
                        ? `You rejected your challenge`
                        : `You Rejected @${ch.challenger.split('@')[0]}'s Challenge`, baileys_1.MessageType.text, undefined, [ch.challengee || '', M.sender.jid]);
                case 'move':
                    const g = this.games.get(M.from);
                    if (!g)
                        return void M.reply('No Chess sessions are currently going on');
                    if (args.length > 3 || args.length < 2)
                        return void M.reply(`The move command must be formatted like: \"${this.client.config.prefix}chess move fromTile toTile\"`);
                    if (args[1] == 'castle') {
                        const to = args[2];
                        if (to.length != 2 || !(typeof to[0] == 'string') || isNaN(parseInt(to[1])))
                            return void M.reply("A move's fromTile and toTile must be of the from 'XZ', where X is a letter A-H, and Z is a number 1-8.");
                        const move = {
                            piece: (0, chess_node_1.genRealMove)(to)
                        };
                        return void g.eventEmitter.emit(M.from, move, print, M.sender.jid, () => () => __awaiter(this, void 0, void 0, function* () {
                            const cig = new chess_image_generator_ts_1.default();
                            cig.loadArray(this.parseBoard(g.board.getPieces(g.white, g.black)));
                            let sent = false;
                            while (!sent) {
                                try {
                                    yield cig.generateBuffer().then((data) => __awaiter(this, void 0, void 0, function* () { return yield M.reply(data, baileys_1.MessageType.image); }));
                                    sent = true;
                                }
                                catch (err) {
                                    continue;
                                }
                            }
                        }));
                    }
                    const from = args[1];
                    const to = args[2];
                    if (from.length != 2 ||
                        !(typeof from[0] == 'string') ||
                        isNaN(parseInt(from[1])) ||
                        to.length != 2 ||
                        !(typeof to[0] == 'string') ||
                        isNaN(parseInt(to[1])))
                        return void M.reply("A move's fromTile and toTile must be of the from 'XZ', where X is a letter A-H, and Z is a number 1-8.");
                    const toMove = (0, chess_node_1.genRealMove)(to);
                    const fromMove = (0, chess_node_1.genRealMove)(from);
                    if (toMove == null || fromMove == null)
                        return void M.reply("A move's fromTile and toTile must be of the from 'XZ', where X is a letter A-H, and Z is a number 1-8.");
                    const move = {
                        from: fromMove,
                        to: toMove
                    };
                    return void g.eventEmitter.emit(M.from, move, print, M.sender.jid, () => __awaiter(this, void 0, void 0, function* () {
                        const cig = new chess_image_generator_ts_1.default();
                        cig.loadArray(this.parseBoard(g.board.getPieces(g.white, g.black)));
                        let sent = false;
                        while (!sent) {
                            try {
                                yield cig.generateBuffer().then((data) => __awaiter(this, void 0, void 0, function* () { return yield M.reply(data, baileys_1.MessageType.image); }));
                                sent = true;
                            }
                            catch (err) {
                                continue;
                            }
                        }
                    }));
                case 'ff':
                    const ga = this.challenges.get(M.from);
                    if (!ga)
                        return void M.reply('No games are currently ongoing');
                    const players = Object.values(ga);
                    if (players.includes(M.sender.jid)) {
                        yield M.reply('You forfited!');
                        return void end(players.filter((player) => M.sender.jid !== player)[0]);
                    }
                    return void M.reply('You are not participating in any games');
                default:
                    return void M.reply(`Invalid Usage Format. Use *${this.client.config.prefix}chess* for more info`);
            }
        });
    }
}
exports.default = Command;
