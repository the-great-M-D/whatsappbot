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
exports.post = void 0;
const request = {
    json: (url) => __awaiter(void 0, void 0, void 0, function* () { return yield (yield fetch(url)).json(); }),
    buffer: (url) => __awaiter(void 0, void 0, void 0, function* () { return Buffer.from(yield (yield fetch(url)).arrayBuffer()); })
};
const post = (url, 
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
data, config) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch(url, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, ((config === null || config === void 0 ? void 0 : config.headers) || {})),
        body: typeof data === 'string' ? data : JSON.stringify(data)
    });
    return (yield res.json());
});
exports.post = post;
exports.default = request;
