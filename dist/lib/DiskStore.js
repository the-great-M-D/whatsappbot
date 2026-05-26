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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureStore = exports.disabledCommandsStore = exports.userStore = exports.groupStore = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const DATA_DIR = (0, path_1.join)(process.cwd(), 'data');
if (!(0, fs_1.existsSync)(DATA_DIR))
    (0, fs_1.mkdirSync)(DATA_DIR, { recursive: true });
function makeCollection(filePath, idField, makeDefaults) {
    const store = new Map();
    if ((0, fs_1.existsSync)(filePath)) {
        try {
            const items = JSON.parse((0, fs_1.readFileSync)(filePath, 'utf8'));
            for (const item of items)
                store.set(String(item[idField]), item);
        }
        catch (_a) {
            console.warn(`[DiskStore] Could not load ${filePath}, starting fresh`);
        }
    }
    const flush = () => {
        const snapshot = JSON.stringify(Array.from(store.values()));
        setImmediate(() => {
            try {
                (0, fs_1.writeFileSync)(filePath, snapshot);
            }
            catch ( /* ignore */_a) { /* ignore */ }
        });
    };
    const wrapDoc = (record) => {
        const doc = Object.assign({}, record);
        doc.save = () => __awaiter(this, void 0, void 0, function* () {
            const { save } = doc, plain = __rest(doc, ["save"]);
            store.set(String(plain[idField]), plain);
            flush();
        });
        return doc;
    };
    const matchQuery = (item, query) => Object.entries(query).every(([k, v]) => item[k] === v);
    return {
        findOne: (query) => __awaiter(this, void 0, void 0, function* () {
            if (idField in query) {
                const item = store.get(String(query[idField]));
                return item ? wrapDoc(item) : null;
            }
            for (const item of store.values()) {
                if (matchQuery(item, query))
                    return wrapDoc(item);
            }
            return null;
        }),
        find: () => __awaiter(this, void 0, void 0, function* () { return Array.from(store.values()).map(wrapDoc); }),
        create: (partial) => __awaiter(this, void 0, void 0, function* () {
            const record = makeDefaults(partial);
            store.set(String(record[idField]), record);
            flush();
            return wrapDoc(record);
        }),
        updateOne: (query, update) => __awaiter(this, void 0, void 0, function* () {
            if (idField in query) {
                const key = String(query[idField]);
                const item = store.get(key);
                if (item) {
                    store.set(key, Object.assign(Object.assign({}, item), update.$set));
                    flush();
                }
                return;
            }
            for (const [key, item] of store.entries()) {
                if (matchQuery(item, query)) {
                    store.set(key, Object.assign(Object.assign({}, item), update.$set));
                    flush();
                    return;
                }
            }
        }),
        deleteOne: (query) => __awaiter(this, void 0, void 0, function* () {
            if (idField in query) {
                store.delete(String(query[idField]));
                flush();
                return;
            }
            for (const [key, item] of store.entries()) {
                if (matchQuery(item, query)) {
                    store.delete(key);
                    flush();
                    return;
                }
            }
        })
    };
}
exports.groupStore = makeCollection((0, path_1.join)(DATA_DIR, 'groups.json'), 'jid', (p) => (Object.assign({ jid: p.jid, events: false, nsfw: false, safe: false, mod: false, cmd: true, invitelink: false }, p)));
exports.userStore = makeCollection((0, path_1.join)(DATA_DIR, 'users.json'), 'jid', (p) => (Object.assign({ jid: p.jid, ban: false, warnings: 0, Xp: 0 }, p)));
exports.disabledCommandsStore = makeCollection((0, path_1.join)(DATA_DIR, 'disabledCommands.json'), 'command', (p) => { var _a; return (Object.assign({ command: p.command, reason: (_a = p.reason) !== null && _a !== void 0 ? _a : '' }, p)); });
exports.featureStore = makeCollection((0, path_1.join)(DATA_DIR, 'features.json'), 'feature', (p) => { var _a; return (Object.assign({ feature: p.feature, state: (_a = p.state) !== null && _a !== void 0 ? _a : false }, p)); });
