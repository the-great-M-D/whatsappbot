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
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../lib/Mongo/Models/User"));
const Group_1 = __importDefault(require("../lib/Mongo/Models/Group"));
const Session_1 = __importDefault(require("../lib/Mongo/Models/Session"));
const DisabledCommands_1 = __importDefault(require("../lib/Mongo/Models/DisabledCommands"));
const Features_1 = __importDefault(require("../lib/Mongo/Models/Features"));
const makeStub = () => ({
    findOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
    find: () => __awaiter(void 0, void 0, void 0, function* () { return []; }),
    create: (data) => __awaiter(void 0, void 0, void 0, function* () { return (Object.assign(Object.assign({}, data), { save: () => __awaiter(void 0, void 0, void 0, function* () { return null; }) })); }),
    deleteOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
    updateOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
});
const makeGroupStub = () => ({
    findOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
    find: () => __awaiter(void 0, void 0, void 0, function* () { return []; }),
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        return (Object.assign(Object.assign({ cmd: true, events: false, nsfw: false, safe: false, mod: false, invitelink: false }, data), { save: () => __awaiter(void 0, void 0, void 0, function* () { return null; }) }));
    }),
    deleteOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
    updateOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
});
class DatabaseHandler {
    constructor() {
        this.user = makeStub();
        this.group = makeGroupStub();
        this.session = makeStub();
        this.disabledcommands = makeStub();
        this.feature = makeStub();
        this.connected = false;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const uri = process.env.MONGODB_URI;
            if (!uri) {
                console.log('[DB] No MONGODB_URI set — running without database');
                return;
            }
            try {
                yield mongoose_1.default.connect(uri, {
                    serverSelectionTimeoutMS: 8000,
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                });
                this.user = User_1.default;
                this.group = Group_1.default;
                this.session = Session_1.default;
                this.disabledcommands = DisabledCommands_1.default;
                this.feature = Features_1.default;
                this.connected = true;
                console.log('[DB] Connected to MongoDB');
            }
            catch (err) {
                console.error(`[DB] MongoDB connection failed: ${err.message} — running without database`);
            }
        });
    }
}
exports.default = DatabaseHandler;
