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
const makeStub = () => ({
    findOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
    find: () => __awaiter(void 0, void 0, void 0, function* () { return []; }),
    create: (data) => __awaiter(void 0, void 0, void 0, function* () { return (Object.assign(Object.assign({}, data), { save: () => __awaiter(void 0, void 0, void 0, function* () { return null; }) })); }),
    deleteOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
    updateOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
});
const makeGroupStub = () => ({
    findOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
    find: () => __awaiter(void 0, void 0, void 0, function* () { return []; }),
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        return (Object.assign(Object.assign({ cmd: true, events: false, nsfw: false, safe: false, mod: false, invitelink: false }, data), { save: () => __awaiter(void 0, void 0, void 0, function* () { return null; }) }));
    }),
    deleteOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
    updateOne: () => __awaiter(void 0, void 0, void 0, function* () { return null; }),
});
class DatabaseHandler {
    constructor() {
        this.user = makeStub();
        this.group = makeGroupStub();
        this.session = makeStub();
        this.disabledcommands = makeStub();
        this.feature = makeStub();
    }
}
exports.default = DatabaseHandler;
