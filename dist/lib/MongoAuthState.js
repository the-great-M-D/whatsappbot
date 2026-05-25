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
exports.clearAuthFromDB = exports.restoreAuthFromDB = exports.backupAuthToDB = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
/**
 * Backs up all auth JSON files from the local auth directory into MongoDB.
 * Each file is stored as a document: { ID: filename_without_ext, session: raw_json_string }
 */
const backupAuthToDB = (model, authDir) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = (yield (0, fs_extra_1.readdir)(authDir)).filter((f) => f.endsWith('.json'));
        yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const id = file.replace(/\.json$/, '');
            const raw = yield (0, fs_extra_1.readFile)((0, path_1.join)(authDir, file), 'utf8');
            yield model.updateOne({ ID: id }, { $set: { session: raw } }, { upsert: true });
        })));
    }
    catch (err) {
        console.error('[DB] Auth backup error:', err.message);
    }
});
exports.backupAuthToDB = backupAuthToDB;
/**
 * Restores auth files from MongoDB to the local auth directory.
 * Only runs if the local creds.json does not exist yet.
 * Returns true if files were restored.
 */
const restoreAuthFromDB = (model, authDir) => __awaiter(void 0, void 0, void 0, function* () {
    const credsFile = (0, path_1.join)(authDir, 'creds.json');
    if (yield (0, fs_extra_1.pathExists)(credsFile))
        return false; // files already exist locally
    const docs = yield model.find({}).lean();
    if (!docs || !docs.length)
        return false;
    yield (0, fs_extra_1.ensureDir)(authDir);
    yield Promise.all(docs.map((doc) => __awaiter(void 0, void 0, void 0, function* () {
        const raw = typeof doc.session === 'string' ? doc.session : JSON.stringify(doc.session);
        if (raw && raw !== 'null') {
            yield (0, fs_extra_1.writeFile)((0, path_1.join)(authDir, `${doc.ID}.json`), raw, 'utf8');
        }
    })));
    console.log(`[DB] Restored ${docs.length} auth files from MongoDB`);
    return true;
});
exports.restoreAuthFromDB = restoreAuthFromDB;
/**
 * Wipes all session documents from MongoDB (used when re-pairing).
 */
const clearAuthFromDB = (model) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield model.deleteMany({});
    }
    catch ( /* ignore */_a) { /* ignore */ }
});
exports.clearAuthFromDB = clearAuthFromDB;
