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
        this.auth = (req, res, next) => {
            const { session } = req.query;
            if (!session)
                return void res.json({ message: `Session Query not provided` });
            if (session !== this.client.config.session)
                return void res.json({ message: `Invalid Session ID` });
            next();
        };
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.static((0, path_1.join)(__dirname, '..', '..', 'public')));
        this.app.get('/api/status', (req, res) => {
            var _a, _b, _c, _d;
            res.json({
                connected: this.client.state === 'open',
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
        this.app.use('/wa', this.WARouter);
        this.WARouter.use(this.auth);
        this.WARouter.get('/qr', (req, res) => {
            res.json({ message: 'QR disabled — use phone number pairing via the dashboard' });
        });
        this.app.listen(PORT, '0.0.0.0', () => this.client.log(`Server Started on PORT: ${PORT}`));
    }
}
exports.default = Server;
