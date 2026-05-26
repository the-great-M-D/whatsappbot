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
exports.activatableFeatures = exports.toggleableGroupActions = void 0;
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const MongoAuthState_1 = require("./MongoAuthState");
const fs_extra_1 = require("fs-extra");
const pino_1 = __importDefault(require("pino"));
const events_1 = __importDefault(require("events"));
const Utils_1 = __importDefault(require("./Utils"));
const DatabaseHandler_1 = __importDefault(require("../Handlers/DatabaseHandler"));
const Message_1 = require("./Message");
exports.toggleableGroupActions = ['announce', 'not_announce', 'locked', 'unlocked'];
exports.activatableFeatures = ['events', 'mod', 'safe', 'nsfw', 'cmd', 'invitelink'];
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
        this.groupMetadataCache = new Map();
        this.cachedBaileysVersion = null;
        this.groupDataCache = new Map();
        this.userDataCache = new Map();
        this.GROUP_DATA_TTL = 5 * 60 * 1000;
        this.QR = null;
        this.QRText = null;
        this.pairCode = null;
        this.pairCodePhone = null;
        this.botLid = null;
        this.state = 'close';
        this.registered = false;
        this.intentionalStop = false;
        this.reconnectAttempts = 0;
        this.MAX_RECONNECTS = 5;
        this.config = config;
    }
    get botJid() {
        var _a;
        const id = ((_a = this.user) === null || _a === void 0 ? void 0 : _a.id) || '';
        return id.replace(/:(\d+)@/, '@');
    }
    log(msg, error = false) {
        console.log(error ? '❌' : '✅', msg);
    }
    stopSocket() {
        this.intentionalStop = true;
        if (this.sock) {
            try {
                this.sock.end(undefined);
            }
            catch ( /* ignore */_a) { /* ignore */ }
            this.sock = null;
        }
        this.state = 'close';
    }
    forceReconnect() {
        this.stopSocket();
        this.reconnectAttempts = 0;
        setTimeout(() => this.connect(), 1000);
    }
    clearAuth() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, fs_extra_1.remove)(`auth/${this.config.session}`).catch(() => { });
            if (this.DB.connected) {
                yield (0, MongoAuthState_1.clearAuthFromDB)(this.DB.session);
            }
        });
    }
    connectWithPhone(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            const cleaned = phone.replace(/\D/g, '');
            if (!cleaned)
                throw new Error('Invalid phone number');
            this.stopSocket();
            yield this.clearAuth();
            const code = yield new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timed out waiting for pairing code (30s). Please try again.')), 30000);
                this.once('pair-code', (c) => { clearTimeout(timeout); resolve(c); });
                this.once('pair-error', (e) => { clearTimeout(timeout); reject(new Error(e)); });
                this.connect(cleaned);
            });
            return code;
        });
    }
    connect(pairingPhone) {
        return __awaiter(this, void 0, void 0, function* () {
            this.intentionalStop = false;
            const authDir = `auth/${this.config.session}`;
            // If DB is connected and local auth files are missing, restore from MongoDB
            if (this.DB.connected) {
                yield (0, MongoAuthState_1.restoreAuthFromDB)(this.DB.session, authDir);
            }
            const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)(authDir);
            if (!this.cachedBaileysVersion) {
                const { version } = yield (0, baileys_1.fetchLatestBaileysVersion)();
                this.cachedBaileysVersion = version;
            }
            const version = this.cachedBaileysVersion;
            const isRegistered = !!state.creds.registered;
            this.sock = (0, baileys_1.default)({
                version,
                logger: (0, pino_1.default)({ level: 'silent' }),
                auth: state,
                printQRInTerminal: false
            });
            // Wrap saveCreds to also back up to MongoDB after every credentials update
            const saveAndBackup = () => __awaiter(this, void 0, void 0, function* () {
                yield saveCreds();
                if (this.DB.connected) {
                    yield (0, MongoAuthState_1.backupAuthToDB)(this.DB.session, authDir);
                }
            });
            this.sock.ev.on('creds.update', saveAndBackup);
            if (pairingPhone && !isRegistered) {
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        this.log(`Requesting pairing code for +${pairingPhone}...`);
                        const code = yield this.sock.requestPairingCode(pairingPhone);
                        this.pairCode = code;
                        this.pairCodePhone = pairingPhone;
                        this.log(`Pairing code ready: ${code}`);
                        this.emit('pair-code', code);
                    }
                    catch (err) {
                        this.log(`Failed to get pairing code: ${err.message}`, true);
                        this.emit('pair-error', err.message);
                    }
                }), 2000);
            }
            this.sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
                var _a, _b, _c, _d;
                if (connection === 'open') {
                    this.state = 'open';
                    this.reconnectAttempts = 0;
                    this.pairCode = null;
                    this.pairCodePhone = null;
                    this.user = this.sock.user;
                    this.log(`Connected as ${((_a = this.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = this.user) === null || _b === void 0 ? void 0 : _b.id) || 'unknown'}`);
                    this.emit('open');
                }
                if (connection === 'close') {
                    this.state = 'close';
                    this.QR = null;
                    this.QRText = null;
                    if (this.intentionalStop) {
                        this.intentionalStop = false;
                        this.reconnectAttempts = 0;
                        return;
                    }
                    const statusCode = (_d = (_c = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _c === void 0 ? void 0 : _c.output) === null || _d === void 0 ? void 0 : _d.statusCode;
                    // 401 = logged out, 440 = session replaced by another device
                    if (statusCode === 401 || statusCode === 440) {
                        const reason = statusCode === 440
                            ? 'session was replaced by another device'
                            : 'logged out by WhatsApp';
                        this.log(`Disconnected: ${reason}. Clearing credentials and resetting to QR...`, true);
                        this.reconnectAttempts = 0;
                        this.clearAuth().then(() => setTimeout(() => this.connect(), 3000));
                        return;
                    }
                    this.reconnectAttempts++;
                    if (this.reconnectAttempts > this.MAX_RECONNECTS) {
                        this.log(`Too many reconnect attempts (${this.reconnectAttempts}). Clearing credentials and resetting to QR...`, true);
                        this.reconnectAttempts = 0;
                        this.clearAuth().then(() => setTimeout(() => this.connect(), 5000));
                        return;
                    }
                    const delay = Math.min(5000 * this.reconnectAttempts, 30000);
                    this.log(`Connection closed (${statusCode !== null && statusCode !== void 0 ? statusCode : 'unknown'}), reconnecting in ${delay / 1000}s... (attempt ${this.reconnectAttempts})`);
                    setTimeout(() => this.connect(), delay);
                }
            });
            this.sock.ev.on('messages.upsert', ({ messages, type }) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e, _f, _g;
                for (const msg of messages) {
                    if (!(msg === null || msg === void 0 ? void 0 : msg.message))
                        continue;
                    if (((_a = msg.key) === null || _a === void 0 ? void 0 : _a.fromMe) && type === 'append')
                        continue;
                    console.log(`[MSG] upsert type=${type} from=${(_b = msg.key) === null || _b === void 0 ? void 0 : _b.remoteJid} fromMe=${(_c = msg.key) === null || _c === void 0 ? void 0 : _c.fromMe}`);
                    // Capture bot's LID from fromMe group messages (key.participant = bot's own LID)
                    if (((_d = msg.key) === null || _d === void 0 ? void 0 : _d.fromMe) && ((_f = (_e = msg.key) === null || _e === void 0 ? void 0 : _e.remoteJid) === null || _f === void 0 ? void 0 : _f.endsWith('@g.us')) && ((_g = msg.key) === null || _g === void 0 ? void 0 : _g.participant)) {
                        const p = msg.key.participant;
                        if (p.endsWith('@lid') && !this.botLid) {
                            this.botLid = p;
                            console.log(`[BOT LID] captured: ${this.botLid}`);
                        }
                    }
                    const simplified = yield (0, Message_1.buildSimplifiedMessage)(msg, this);
                    if (simplified)
                        this.emit('new-message', simplified);
                }
            }));
            this.sock.ev.on('group-participants.update', (data) => {
                if (data === null || data === void 0 ? void 0 : data.id)
                    this.invalidateGroupCache(data.id);
                this.emit('group-participants-update', data);
            });
            this.sock.ev.on('contacts.upsert', (contacts) => {
                for (const contact of contacts) {
                    if (contact.id)
                        this.contacts[contact.id] = contact;
                }
            });
            this.sock.ev.on('contacts.update', (contacts) => {
                for (const contact of contacts) {
                    if (contact.id) {
                        this.contacts[contact.id] = Object.assign(Object.assign({}, this.contacts[contact.id]), contact);
                    }
                }
            });
            this.sock.ev.on('chats.upsert', (chats) => {
                for (const chat of chats) {
                    if (chat.id)
                        this.chats[chat.id] = chat;
                }
            });
            this.sock.ev.on('chats.update', (chats) => {
                for (const chat of chats) {
                    if (chat.id)
                        this.chats[chat.id] = Object.assign(Object.assign({}, this.chats[chat.id]), chat);
                }
            });
            this.sock.ev.on('call', (calls) => {
                for (const call of calls) {
                    this.emit('CB:Call', call);
                }
            });
        });
    }
    sendMessage(jid, content, type, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type === undefined || typeof type === 'object') {
                return this.sock.sendMessage(jid, content);
            }
            const typeStr = String(type);
            if (typeStr === 'text' || typeStr === 'extendedText') {
                return this.sock.sendMessage(jid, Object.assign({ text: typeof content === 'string' ? content : JSON.stringify(content) }, ((options === null || options === void 0 ? void 0 : options.contextInfo) ? { mentions: options.contextInfo.mentionedJid || [] } : {})));
            }
            if (typeStr === 'image') {
                return this.sock.sendMessage(jid, Object.assign({ image: Buffer.isBuffer(content) ? content : Buffer.from(content), caption: (options === null || options === void 0 ? void 0 : options.caption) || '' }, ((options === null || options === void 0 ? void 0 : options.contextInfo) ? { mentions: options.contextInfo.mentionedJid || [] } : {})));
            }
            if (typeStr === 'video') {
                return this.sock.sendMessage(jid, Object.assign({ video: Buffer.isBuffer(content) ? content : Buffer.from(content), caption: (options === null || options === void 0 ? void 0 : options.caption) || '' }, ((options === null || options === void 0 ? void 0 : options.contextInfo) ? { mentions: options.contextInfo.mentionedJid || [] } : {})));
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
            try {
                yield this.sock.rejectCall(callID, caller);
            }
            catch ( /* ignore */_a) { /* ignore */ }
            yield this.sendMessage(caller, { text: '❌ Calls are not allowed' });
        });
    }
    generateMessageTag() {
        return `${Math.floor(Math.random() * 1000)}.--${Date.now()}`;
    }
    saveAuthInfo(_session) {
        return __awaiter(this, void 0, void 0, function* () {
            // handled by Baileys useMultiFileAuthState
        });
    }
    getAuthInfo(_session) {
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
            const cached = this.groupMetadataCache.get(jid);
            if (cached && Date.now() - cached.ts < CACHE_TTL)
                return cached.data;
            try {
                const data = yield this.sock.groupMetadata(jid);
                if (data)
                    this.groupMetadataCache.set(jid, { data, ts: Date.now() });
                return data;
            }
            catch (_b) {
                return (_a = cached === null || cached === void 0 ? void 0 : cached.data) !== null && _a !== void 0 ? _a : null;
            }
        });
    }
    invalidateGroupCache(jid) {
        this.groupMetadataCache.delete(jid);
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
                return yield this.sock.groupInviteCode(jid);
            }
            catch (_a) {
                return null;
            }
        });
    }
    isBotAdmin(admins) {
        if (admins.includes(this.botJid))
            return true;
        if (this.botLid && admins.includes(this.botLid))
            return true;
        return false;
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
            catch ( /* ignore */_a) { /* ignore */ }
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
    groupSettingChange(jid, setting) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sock.groupSettingUpdate(jid, setting);
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
                return yield this.sock.sendMessage(jid, { delete: message.key || message });
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
        return this.contacts[jid] || { notify: jid.split('@')[0], id: jid };
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
            const result = yield user.save();
            this.invalidateUser(jid);
            return result;
        });
    }
    unbanUser(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.DB.user.findOne({ jid });
            if (!user)
                return null;
            user.ban = false;
            const result = yield user.save();
            this.invalidateUser(jid);
            return result;
        });
    }
    getGroupData(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            const cached = this.groupDataCache.get(jid);
            if (cached && Date.now() - cached.ts < this.GROUP_DATA_TTL)
                return cached.data;
            let group = yield this.DB.group.findOne({ jid });
            if (!group)
                group = yield this.DB.group.create({ jid });
            this.groupDataCache.set(jid, { data: group, ts: Date.now() });
            return group;
        });
    }
    invalidateGroupData(jid) {
        this.groupDataCache.delete(jid);
    }
    getUser(jid) {
        return __awaiter(this, void 0, void 0, function* () {
            const cached = this.userDataCache.get(jid);
            if (cached)
                return cached;
            let user = yield this.DB.user.findOne({ jid });
            if (!user)
                user = yield this.DB.user.create({ jid });
            this.userDataCache.set(jid, user);
            return user;
        });
    }
    invalidateUser(jid) {
        this.userDataCache.delete(jid);
    }
    setXp(jid, xp, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getUser(jid);
            user.Xp = Math.min((user.Xp || 0) + xp, limit * 100);
            yield user.save();
            this.userDataCache.set(jid, user);
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
