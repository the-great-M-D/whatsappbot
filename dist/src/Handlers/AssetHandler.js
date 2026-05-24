"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
class default_1 {
    constructor(client) {
        this.client = client;
        this.path = (0, path_1.join)(__dirname, '..', '..', 'assets');
        this.loadAssets = () => {
            const files = this.client.util.readdirRecursive(this.path);
            this.client.log(chalk_1.default.green('Loading Assets...'));
            files.map((file) => {
                const buffer = (0, fs_extra_1.readFileSync)(file);
                const split = file.split('/');
                const key = split[split.length - 1].split('.')[0];
                this.client.assets.set(key, buffer);
                this.client.log(`Loaded: ${chalk_1.default.green(key)} from ${chalk_1.default.green(file)}`);
            });
            this.client.log(`Successfully Loaded ${chalk_1.default.greenBright(this.client.assets.size)} Assets`);
        };
    }
}
exports.default = default_1;
