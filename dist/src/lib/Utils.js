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
const fs_1 = require("fs");
const path_1 = require("path");
const get_urls_1 = __importDefault(require("get-urls"));
const child_process_1 = require("child_process");
const promises_1 = require("fs/promises");
const os_1 = require("os");
const util_1 = require("util");
class default_1 {
    constructor() {
        this.exec = (0, util_1.promisify)(child_process_1.exec);
        this.GIFBufferToVideoBuffer = (image) => __awaiter(this, void 0, void 0, function* () {
            const filename = `${(0, os_1.tmpdir)()}/${Math.random().toString(36)}`;
            yield (0, promises_1.writeFile)(`${filename}.gif`, image);
            yield this.exec(`ffmpeg -f gif -i ${filename}.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ${filename}.mp4`);
            const buffer = yield (0, promises_1.readFile)(`${filename}.mp4`);
            Promise.all([(0, promises_1.unlink)(`${filename}.mp4`), (0, promises_1.unlink)(`${filename}.gif`)]);
            return buffer;
        });
        this.readdirRecursive = (directory) => {
            const results = [];
            const read = (path) => {
                const files = (0, fs_1.readdirSync)(path);
                for (const file of files) {
                    const dir = (0, path_1.join)(path, file);
                    if ((0, fs_1.statSync)(dir).isDirectory())
                        read(dir);
                    else
                        results.push(dir);
                }
            };
            read(directory);
            return results;
        };
        this.capitalize = (text) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
        this.getUrls = (text) => Array.from((0, get_urls_1.default)(text));
        this.chunk = (arr, length) => {
            const result = [];
            for (let i = 0; i < arr.length / length; i++) {
                result.push(arr.slice(i * length, i * length + length));
            }
            return result;
        };
    }
}
exports.default = default_1;
