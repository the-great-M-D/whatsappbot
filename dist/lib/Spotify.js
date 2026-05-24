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
const spotifydl_core_1 = __importDefault(require("spotifydl-core"));
/** Using public keys */
const client = new spotifydl_core_1.default({
    clientId: 'acc6302297e040aeb6e4ac1fbdfd62c3',
    clientSecret: '0e8439a1280a43aba9a5bc0a16f3f009'
});
class default_1 {
    constructor(url) {
        this.url = url;
        this.getInfo = () => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield client.getTrack(this.url);
            }
            catch (_a) {
                return { error: `Error Fetching ${this.url}` };
            }
        });
        this.getAudio = () => __awaiter(this, void 0, void 0, function* () { return yield client.downloadTrack(this.url); });
    }
}
exports.default = default_1;
