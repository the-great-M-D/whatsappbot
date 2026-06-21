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
const express_1 = __importDefault(require("express"));
const events_1 = require("events");
const path_1 = require("path");
class Server extends events_1.EventEmitter {
    constructor(PORT, client) {
        super();
        this.PORT = PORT;
        this.client = client;
        this.app = (0, express_1.default)();
        this.WARouter = express_1.default.Router();
        this.sseClients = new Set();
        this.eventBuffer = [];
        this.stats = { messages: 0, commands: 0 };
        this.startTime = Date.now();
        this.handler = null;
        this.auth = (req, res, next) => {
            var _a, _b;
            const session = ((_a = req.query.session) !== null && _a !== void 0 ? _a : (_b = req.body) === null || _b === void 0 ? void 0 : _b.session);
            if (!session)
                return void res.status(401).json({ message: `Session not provided` });
            if (session !== this.client.config.session)
                return void res.status(403).json({ message: `Invalid session` });
            next();
        };
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.static((0, path_1.join)(__dirname, '..', '..', 'public')));
        // ── Pairing / status ────────────────────────────────────────────────
        this.app.get('/api/status', (_req, res) => {
            var _a, _b, _c, _d;
            res.json({
                connected: this.client.state === 'open',
                needsRepair: this.client.needsRepair || false,
                pairCode: this.client.pairCode || null,
                pairCodePhone: this.client.pairCodePhone || null,
                user: this.client.state === 'open'
                    ? (((_a = this.client.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = this.client.user) === null || _b === void 0 ? void 0 : _b.notify) || ((_d = (_c = this.client.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.split(':')[0]) || 'Connected')
                    : null
            });
        });
        this.app.post('/api/pair', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { phone } = req.body;
                if (!phone)
                    return void res.status(400).json({ error: 'Phone number is required' });
                const code = yield this.client.connectWithPhone(phone);
                res.json({ code });
            }
            catch (err) {
                res.status(500).json({ error: err.message || 'Failed to generate pairing code' });
            }
        }));
        // ── Send message from dashboard ──────────────────────────────────────
        this.app.post('/api/send', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { jid, text } = req.body;
                if (!jid || !text) return void res.status(400).json({ error: 'jid and text are required' });
                if (this.client.state !== 'open') return void res.status(503).json({ error: 'Bot is not connected' });
                yield this.client.sendMessage(jid, { text: String(text) });
                res.json({ ok: true });
            } catch (err) {
                res.status(500).json({ error: err.message || 'Failed to send' });
            }
        }));
        // ── Stats ────────────────────────────────────────────────────────────
        this.app.get('/api/stats', (_req, res) => {
            var _a, _b, _c, _d;
            const commandsLoaded = this.handler ? this.handler.commands.size : 0;
            res.json({
                connected: this.client.state === 'open',
                user: this.client.state === 'open'
                    ? (((_a = this.client.user) === null || _a === void 0 ? void 0 : _a.name) || ((_c = (_b = this.client.user) === null || _b === void 0 ? void 0 : _b.id) === null || _c === void 0 ? void 0 : _c.split(':')[0]) || 'Connected')
                    : null,
                messages: this.stats.messages,
                commands: this.stats.commands,
                commandsLoaded,
                uptime: Date.now() - this.startTime,
                prefix: ((_d = this.client.config) === null || _d === void 0 ? void 0 : _d.prefix) || '!'
            });
        });
        // ── Commands list ─────────────────────────────────────────────────────
        this.app.get('/api/commands', (_req, res) => {
            if (!this.handler)
                return void res.json({ categories: {} });
            const categories = {};
            this.handler.commands.forEach((cmd) => {
                const cat = cmd.config.category || 'other';
                if (!categories[cat])
                    categories[cat] = [];
                categories[cat].push(cmd.config.command);
            });
            // sort each category list alphabetically
            for (const cat of Object.keys(categories))
                categories[cat].sort();
            res.json({ categories });
        });
        // ── SSE event stream ──────────────────────────────────────────────────
        this.app.get('/api/events', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders();
            // replay history so new tabs see recent events immediately
            for (const evt of this.eventBuffer) {
                res.write(`data: ${JSON.stringify(evt)}\n\n`);
            }
            this.sseClients.add(res);
            const ping = setInterval(() => {
                try {
                    res.write(': ping\n\n');
                }
                catch ( /* ignore */_a) { /* ignore */ }
            }, 20000);
            req.on('close', () => {
                clearInterval(ping);
                this.sseClients.delete(res);
            });
        });
        // ── Legacy WA router ──────────────────────────────────────────────────
        this.app.use('/wa', this.WARouter);
        this.WARouter.use(this.auth);
        this.WARouter.get('/qr', (_req, res) => {
            res.json({ message: 'QR disabled — use phone number pairing via the dashboard' });
        });
        this.app.listen(PORT, '0.0.0.0', () => this.client.log(`Server Started on PORT: ${PORT}`))
            .on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    this.client.log(`Port ${PORT} already in use — dashboard unavailable`, true);
                } else {
                    throw err;
                }
            });
        this.attachClientEvents();
    }
    setHandler(handler) {
        this.handler = handler;
    }
    pushEvent(evt) {
        const full = Object.assign({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, evt);
        this.eventBuffer.push(full);
        if (this.eventBuffer.length > 200)
            this.eventBuffer.shift();
        const payload = `data: ${JSON.stringify(full)}\n\n`;
        this.sseClients.forEach((res) => {
            var _a, _b;
            try {
                res.write(payload);
                (_b = (_a = res).flush) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
            catch (_c) {
                this.sseClients.delete(res);
            }
        });
    }
    attachClientEvents() {
        this.client.on('new-message', (M) => {
            var _a, _b, _c, _d, _e, _f;
            this.stats.messages++;
            const isCmd = (_a = M.content) === null || _a === void 0 ? void 0 : _a.startsWith(((_b = this.client.config) === null || _b === void 0 ? void 0 : _b.prefix) || '!');
            if (!isCmd) {
                const sender = ((_c = M.sender) === null || _c === void 0 ? void 0 : _c.username) || ((_e = (_d = M.sender) === null || _d === void 0 ? void 0 : _d.jid) === null || _e === void 0 ? void 0 : _e.split('@')[0]) || '?';
                const group = ((_f = M.groupMetadata) === null || _f === void 0 ? void 0 : _f.subject) || null;
                this.pushEvent({
                    type: 'message',
                    icon: '💬',
                    title: `${sender}${group ? ` in ${group}` : ' (DM)'}`,
                    detail: (M.content || '').slice(0, 120),
                    ts: Date.now()
                });
            }
        });
        this.client.on('command-executed', ({ command, sender, group }) => {
            var _a;
            this.stats.commands++;
            this.pushEvent({
                type: 'command',
                icon: '⚡',
                title: `${((_a = this.client.config) === null || _a === void 0 ? void 0 : _a.prefix) || '!'}${command}  ·  ${sender}`,
                detail: group || 'DM',
                ts: Date.now()
            });
        });
        this.client.on('group-participants-update', ({ jid, participants, action, actor }) => {
            const icons = { add: '👋', remove: '🚪', promote: '⭐', demote: '⬇️' };
            const labels = { add: 'joined', remove: 'left', promote: 'promoted in', demote: 'demoted in' };
            const names = (participants || []).map((p) => p.split('@')[0]).join(', ');
            const groupName = Object.values(this.client.chats || {}).find((c) => c.id === jid);
            this.pushEvent({
                type: 'group',
                icon: icons[action] || '👥',
                title: `${names} ${labels[action] || action}`,
                detail: ((groupName === null || groupName === void 0 ? void 0 : groupName.name) || (groupName === null || groupName === void 0 ? void 0 : groupName.subject) || (jid === null || jid === void 0 ? void 0 : jid.split('@')[0]) || jid) + (actor ? `  ·  by ${actor.split('@')[0]}` : ''),
                ts: Date.now()
            });
        });
        this.client.on('CB:Call', (call) => {
            var _a;
            const from = ((_a = call.from) === null || _a === void 0 ? void 0 : _a.split('@')[0]) || 'unknown';
            this.pushEvent({
                type: 'call',
                icon: '📞',
                title: `Incoming call from +${from}`,
                detail: 'Auto-rejected',
                ts: Date.now()
            });
        });
        this.client.on('open', () => {
            var _a, _b, _c;
            const name = ((_a = this.client.user) === null || _a === void 0 ? void 0 : _a.name) || ((_c = (_b = this.client.user) === null || _b === void 0 ? void 0 : _b.id) === null || _c === void 0 ? void 0 : _c.split(':')[0]) || 'Bot';
            this.pushEvent({
                type: 'connect',
                icon: '✅',
                title: `Connected as ${name}`,
                detail: 'WhatsApp session active',
                ts: Date.now()
            });
        });
        this.client.on('needs-repair', () => {
            this.pushEvent({
                type: 'system',
                icon: '🔧',
                title: 'Re-pairing required',
                detail: 'No auth found locally or in database. Use the dashboard to pair via phone number.',
                ts: Date.now()
            });
        });
    }
}
exports.default = Server;
