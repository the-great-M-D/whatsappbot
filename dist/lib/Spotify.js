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
Object.defineProperty(exports, "__esModule", { value: true });
const clientId = process.env.SPOTIFY_CLIENT_ID || '';
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
if (!clientId || !clientSecret) {
    console.warn('[Spotify] SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET env vars not set — spotify commands will fail');
}
class default_1 {
    constructor(url) {
        this.url = url;
        this.getInfo = () => __awaiter(this, void 0, void 0, function* () {
            return { error: `Spotify download is not configured. URL: ${this.url}` };
        });
        this.getAudio = () => __awaiter(this, void 0, void 0, function* () {
            throw new Error('Spotify download is not configured');
        });
    }
}
exports.default = default_1;
