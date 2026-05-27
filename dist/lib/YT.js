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
const os_1 = require("os");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const child_process_1 = require("child_process");
const util_1 = require("util");
const ytdl_core_1 = __importDefault(require("@distube/ytdl-core"));
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const YT_DLP = 'yt-dlp';
class YT {
    constructor(url, type) {
        this.url = url;
        this.type = type;
        this.validateURL = () => ytdl_core_1.default.validateURL(this.url);
        this.getInfo = () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const info = yield ytdl_core_1.default.getInfo(this.url);
            const d = info.videoDetails;
            return {
                title: d.title,
                author: ((_a = d.author) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                lengthSeconds: Number(d.lengthSeconds),
                thumbnail: ((_c = (_b = d.thumbnails) === null || _b === void 0 ? void 0 : _b[d.thumbnails.length - 1]) === null || _c === void 0 ? void 0 : _c.url) || `https://i.ytimg.com/vi/${this.id}/hqdefault.jpg`,
                url: d.video_url || this.url,
                viewCount: Number(d.viewCount).toLocaleString()
            };
        });
        this.getBuffer = () => __awaiter(this, void 0, void 0, function* () {
            const ext = this.type === 'audio' ? 'mp3' : 'mp4';
            const out = (0, path_1.join)((0, os_1.tmpdir)(), `yt_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
            const args = [
                '--no-playlist',
                '--no-warnings',
                '-o', out,
            ];
            if (this.type === 'audio') {
                args.push('-f', 'bestaudio', '-x', '--audio-format', 'mp3', '--audio-quality', '0');
            }
            else {
                args.push('-f', 'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best[height<=720]', '--merge-output-format', 'mp4');
            }
            args.push(this.url);
            yield execFileAsync(YT_DLP, args, { timeout: 120000 });
            const buffer = yield (0, fs_extra_1.readFile)(out);
            (0, fs_extra_1.unlink)(out).catch(() => null);
            return buffer;
        });
        this.getThumbnail = () => __awaiter(this, void 0, void 0, function* () {
            const { default: axios } = yield Promise.resolve().then(() => __importStar(require('axios')));
            const resp = yield axios.get(`https://i.ytimg.com/vi/${this.id}/hqdefault.jpg`, { responseType: 'arraybuffer' });
            return Buffer.from(resp.data);
        });
        this.parseId = () => {
            try {
                const u = new URL(this.url);
                if (u.hostname === 'youtu.be')
                    return u.pathname.slice(1).split('?')[0];
                return u.searchParams.get('v') || '';
            }
            catch (_a) {
                return '';
            }
        };
        this.id = this.parseId();
    }
}
exports.default = YT;
