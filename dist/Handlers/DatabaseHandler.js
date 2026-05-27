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
const Session_1 = __importDefault(require("../lib/Mongo/Models/Session"));
const DiskStore_1 = require("../lib/DiskStore");
const makeStub = () => ({
    findOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
    find: () => __awaiter(void 0, void 0, void 0, function* () { return []; }),
    create: (data) => __awaiter(void 0, void 0, void 0, function* () { return (Object.assign(Object.assign({}, data), { save: () => __awaiter(void 0, void 0, void 0, function* () { return null; }) })); }),
    deleteOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
    updateOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
});
class DatabaseHandler {
    constructor() {
        this.user = DiskStore_1.userStore;
        this.group = DiskStore_1.groupStore;
        this.session = makeStub();
        this.disabledcommands = DiskStore_1.disabledCommandsStore;
        this.feature = DiskStore_1.featureStore;
        this.connected = false;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const uri = process.env.MONGODB_URL || process.env.MONGODB_URI;
            if (!uri) {
                console.log('[DB] No MONGODB_URL — auth backup disabled, disk store active');
                return;
            }
            try {
                yield mongoose_1.default.connect(uri, {
                    serverSelectionTimeoutMS: 8000,
                });
                this.session = Session_1.default;
                this.connected = true;
                console.log('[DB] MongoDB connected (auth/session only) — all other data on disk');
            }
            catch (err) {
                console.error(`[DB] MongoDB connection failed: ${err.message} — auth backup disabled`);
            }
        });
    }
}
exports.default = DatabaseHandler;
