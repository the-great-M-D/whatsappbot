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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.toggleableGroupActions = void 0;
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const pino_1 = __importDefault(require("pino"));
const events_1 = __importDefault(require("events"));
const Utils_1 = __importDefault(require("./Utils"));
const DatabaseHandler_1 = __importDefault(require("../Handlers/DatabaseHandler"));
exports.toggleableGroupActions = ['announce', 'not_announce', 'locked', 'unlocked'];
class WAClient extends events_1.default {
    constructor(config) {
        super();
        this.user = {};
        this.util = new Utils_1.default();
        this.assets = new Map();
        this.DB = new DatabaseHandler_1.default();
        this.features = new Map();
        this.contacts = {};
        this.chats = {};
        this.QR = null;
        this.QRText = null;
        this.pairCode = null;
        this.pairCodePhone = null;
        this.state = 'close';
        this.registered = false;
        this.config = config;
    }
    log(msg, error = false) {
        console.log(error ? '❌' : '✅', msg);
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(`auth/${this.config.session}`);
            const { version } = yield (0, baileys_1.fetchLatestBaileysVersion)();
            this.registered = !!state.creds.registered;
            this.sock = (0, baileys_1.default)({
                version,
                logger: (0, pino_1.default)({ level: 'silent' }),
                auth: state,
                printQRInTerminal: false
            });
            this.sock.ev.on('creds.update', saveCreds);
            this.sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
                var _a, _b;
                if (qr) {
                    this.QRText = qr;
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        const qrImage = require('qr-image');
                        this.QR = qrImage.imageSync(qr, { type: 'png' });
                    }
                    catch (_c) {
                        this.QR = null;
                    }
                    this.emit('qr', qr);
                }
                if (connection === 'open') {
                    this.state = 'open';
                    this.pairCode = null;
                    this.pairCodePhone = null;
                    this.user = this.sock.user;
                    this.emit('open');
                }
                if (connection === 'close') {
                    this.state = 'close';
                    const statusCode = (_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode;
                    const shouldReconnect = statusCode !== baileys_1.DisconnectReason.loggedOut && statusCode !== 403;
                    if (shouldReconnect) {
                        this.log(`Connection closed (${statusCode}), reconnecting in 5s...`);
                        setTimeout(() => this.connect(), 5000);
                    }
                    else {
                        this.log(`Connection closed permanently (${statusCode}), not reconnecting`, true);
                    }
                }
            });
            this.sock.ev.on('messages.upsert', ({ messages }) => {
                const msg = messages[0];
                if (!msg.message)
                    return;
                this.emit('new-message', msg);
            });
            this.sock.ev.on('group-participants.update', (data) => {
                this.emit('group-participants-update', data);
            });
            if (this.sock.ws) {
                this.sock.ws.on('CB:call', (json) => {
                    this.emit('CB:Call', json);
                });
            }
        });
    }
    sendMessage(jid, content, type, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type === undefined || typeof type === 'object') {
                return this.sock.sendMessage(jid, content);
            }
            // Handle old MessageType-style calls
            const typeStr = String(type);
            if (typeStr === 'text' || typeStr === 'extendedText') {
                return this.sock.sendMessage(jid, Object.assign({ text: content }, ((options === null || options === void 0 ? void 0 : options.contextInfo) ? { contextInfo: options.contextInfo } : {})));
            }
            if (typeStr === 'image') {
                return this.sock.sendMessage(jid, Object.assign({ image: Buffer.isBuffer(content) ? content : Buffer.from(content), caption: (options === null || options === void 0 ? void 0 : options.caption) || '' }, ((options === null || options === void 0 ? void 0 : options.contextInfo) ? { contextInfo: options.contextInfo } : {})));
            }
            if (typeStr === 'video') {
                return this.sock.sendMessage(jid, Object.assign({ video: Buffer.isBuffer(content) ? content : Buffer.from(content), caption: (options === null || options === void 0 ? void 0 : options.caption) || '' }, ((options === null || options === void 0 ? void 0 : options.contextInfo) ? { contextInfo: options.contextInfo } : {})));
            }
            if (typeStr === 'audio') {
                return this.sock.sendMessage(jid, {
                    audio: Buffer.isBuffer(content) ? content : Buffer.from(content),
                    mimetype: (options === null || options === void 0 ? void 0 : options.mimetype) || 'audio/mp4'
                });
            }
            if (typeStr === 'sticker') {
                return this.sock.sendMessage(jid, {
                    sticker: Buffer.isBuffer(content) ? content : Buffer.from(content)
                });
            }
            if (typeStr === 'document') {
                return this.sock.sendMessage(jid, {
                    document: Buffer.isBuffer(content) ? content : Buffer.from(content),
                    mimetype: (options === null || options === void 0 ? void 0 : options.mimetype) || 'application/octet-stream',
                    fileName: (options === null || options === void 0 ? void 0 : options.filename) || 'file'
                });
            }
            return this.sock.sendMessage(jid, { text: String(content) });
        });
    }
    rejectCall(caller, callID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendMessage(caller, { text: '❌ Calls are not allowed' });
        });
    }
    generateMessageTag() {
        return `${Math.floor(Math.random() * 1000)}.--${Date.now()}`;
    }
    sendWA(payload) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if ((_b = (_a = this.sock) === null || _a === void 0 ? void 0 : _a.ws) === null || _b === void 0 ? void 0 : _b.send) {
                    this.sock.ws.send(payload);
                }
            }
            catch (_c) {
                // ignore
            }
        });
    }
    requestPairCode(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state === 'open')
                throw new Error('Already connected');
            if (!this.sock)
                throw new Error('Socket not ready yet, please wait a moment and try again');
            // Strip all non-digits
            const cleaned = phone.replace(/\D/g, '');
            if (!cleaned)
                throw new Error('Invalid phone number');
            const code = yield this.sock.requestPairingCode(cleaned);
            this.pairCode = code;
            this.pairCodePhone = cleaned;
            this.log(`Pairing code requested for +${cleaned}: ${code}`);
            return code;
        });
    }
    saveAuthInfo(session) {
        return __awaiter(this, void 0, void 0, function* () {
            // handled by Baileys useMultiFileAuthState
        });
    }
    getAuthInfo(session) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    loadAuthInfo(_) {
        // no-op
    }
    modifyAllChats(type) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log(`modifyAllChats not implemented (${type})`);
        });
    }
    fetchGroupMetadataFromWA(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sock.groupMetadata(jid);
            }
            catch (_a) {
                return null;
            }
        });
    }
    getProfilePicture(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sock.profilePictureUrl(jid, 'image');
            }
            catch (_a) {
                return null;
            }
        });
    }
    groupInviteCode(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const code = yield this.sock.groupInviteCode(jid);
                return code;
            }
            catch (_a) {
                return null;
            }
        });
    }
    groupRemove(jid, participants) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sock.groupParticipantsUpdate(jid, participants, 'remove');
            }
            catch (_a) {
                return null;
            }
        });
    }
    groupAdd(jid, participants) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sock.groupParticipantsUpdate(jid, participants, 'add');
            }
            catch (_a) {
                return null;
            }
        });
    }
    groupMakeAdmin(jid, participants) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sock.groupParticipantsUpdate(jid, participants, 'promote');
            }
            catch (_a) {
                return null;
            }
        });
    }
    groupDemoteAdmin(jid, participants) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sock.groupParticipantsUpdate(jid, participants, 'demote');
            }
            catch (_a) {
                return null;
            }
        });
    }
    groupLeave(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.sock.groupLeave(jid);
            }
            catch (_a) {
                // ignore
            }
        });
    }
    acceptInvite(code) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sock.groupAcceptInvite(code);
            }
            catch (_a) {
                return null;
            }
        });
    }
    revokeInvite(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sock.groupRevokeInvite(jid);
            }
            catch (_a) {
                return null;
            }
        });
    }
    groupSettingChange(jid, setting, revert = false) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const action = revert ? 'not_announce' : setting;
                return yield this.sock.groupSettingUpdate(jid, action);
            }
            catch (_a) {
                return null;
            }
        });
    }
    groupUpdateSubject(jid, subject) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sock.groupUpdateSubject(jid, subject);
            }
            catch (_a) {
                return null;
            }
        });
    }
    groupUpdateDescription(jid, description) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sock.groupUpdateDescription(jid, description);
            }
            catch (_a) {
                return null;
            }
        });
    }
    deleteMessage(jid, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sock.sendMessage(jid, { delete: message.key });
            }
            catch (_a) {
                return null;
            }
        });
    }
    downloadMediaMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, baileys_1.downloadMediaMessage)(message, 'buffer', {});
        });
    }
    isOnWhatsApp(jid) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.sock.onWhatsApp(jid);
                return ((_a = result === null || result === void 0 ? void 0 : result[0]) === null || _a === void 0 ? void 0 : _a.exists) || false;
            }
            catch (_b) {
                return false;
            }
        });
    }
    getStatus(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.sock.fetchStatus(jid);
                return (result === null || result === void 0 ? void 0 : result.status) || null;
            }
            catch (_a) {
                return null;
            }
        });
    }
    getContact(jid) {
        return this.contacts[jid] || { notify: jid.split('@')[0] };
    }
    fetch(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const { default: axios } = yield Promise.resolve().then(() => __importStar(require('axios')));
            return axios.get(url);
        });
    }
    getBuffer(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const { default: axios } = yield Promise.resolve().then(() => __importStar(require('axios')));
            const response = yield axios.get(url, { responseType: 'arraybuffer' });
            return Buffer.from(response.data);
        });
    }
    banUser(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield this.DB.user.findOne({ jid });
            if (!user)
                user = yield this.DB.user.create({ jid });
            user.ban = true;
            return user.save();
        });
    }
    unbanUser(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.DB.user.findOne({ jid });
            if (!user)
                return null;
            user.ban = false;
            return user.save();
        });
    }
    getGroupData(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            let group = yield this.DB.group.findOne({ jid });
            if (!group)
                group = yield this.DB.group.create({ jid });
            return group;
        });
    }
    getUser(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield this.DB.user.findOne({ jid });
            if (!user)
                user = yield this.DB.user.create({ jid });
            return user;
        });
    }
    setXp(jid, xp, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getUser(jid);
            user.Xp = Math.min((user.Xp || 0) + xp, limit * 100);
            yield user.save();
        });
    }
    isFeature(name) {
        var _a;
        return (_a = this.features.get(name)) !== null && _a !== void 0 ? _a : false;
    }
    getFeatures(name) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const feature = yield this.DB.feature.findOne({ feature: name });
            return (_a = feature === null || feature === void 0 ? void 0 : feature.state) !== null && _a !== void 0 ? _a : false;
        });
    }
    setFeatures() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const features = yield this.DB.feature.find();
                for (const feature of features) {
                    this.features.set(feature.feature, feature.state);
                }
            }
            catch (err) {
                this.log(`Features could not be loaded from database: ${err.message}`, true);
            }
        });
    }
}
exports.default = WAClient;
