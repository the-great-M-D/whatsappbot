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
const request_1 = __importDefault(require("./request"));
const fs_extra_1 = require("fs-extra");
const os_1 = require("os");
const ytdl_core_1 = __importStar(require("ytdl-core"));
class YT {
    constructor(url, type) {
        this.url = url;
        this.type = type;
        this.validateURL = () => (0, ytdl_core_1.validateURL)(this.url);
        this.getInfo = () => __awaiter(this, void 0, void 0, function* () { return yield ytdl_core_1.default.getInfo(this.url); });
        this.getBuffer = (...args_1) => __awaiter(this, [...args_1], void 0, function* (filename = `${(0, os_1.tmpdir)()}/${Math.random().toString(36)}.${this.type === 'audio' ? 'mp3' : 'mp4'}`) {
            const writeStream = (0, fs_extra_1.createWriteStream)(filename);
            const ytStream = (0, ytdl_core_1.default)(this.url, { quality: this.type === 'audio' ? 'highestaudio' : 'highest' });
            ytStream.pipe(writeStream);
            filename = yield new Promise((resolve, reject) => {
                ytStream.on('error', reject);
                writeStream.on('finish', () => resolve(filename));
                writeStream.on('error', reject);
            });
            return yield (0, fs_extra_1.readFile)(filename);
        });
        this.getThumbnail = () => __awaiter(this, void 0, void 0, function* () { return yield request_1.default.buffer(`https://i.ytimg.com/vi/${this.id}/hqdefault.jpg`); });
        this.parseId = () => {
            const split = this.url.split('/');
            if (this.url.includes('youtu.be'))
                return split[split.length - 1];
            return this.url.split('=')[1];
        };
        this.id = this.parseId();
    }
}
exports.default = YT;
