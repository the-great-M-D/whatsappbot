"use strict";
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
        this.app.use(express_1.default.static((0, path_1.join)(__dirname, '..', '..', 'public')));
        this.app.use('/wa', this.WARouter);
        this.WARouter.use(this.auth);
        this.WARouter.get('/qr', (req, res) => {
            if (!this.client.QR)
                return void res.json({
                    message: this.client.state === 'open' ? "You're already authenticated" : 'QR is not generated yet'
                });
            res.contentType('image/png');
            return void res.send(this.client.QR);
        });
        this.app.listen(PORT, '0.0.0.0', () => this.client.log(`Server Started on PORT: ${PORT}`));
    }
}
exports.default = Server;
