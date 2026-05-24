"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../lib/Mongo/Models/User"));
const Group_1 = __importDefault(require("../lib/Mongo/Models/Group"));
const Session_1 = __importDefault(require("../lib/Mongo/Models/Session"));
const DisabledCommands_1 = __importDefault(require("../lib/Mongo/Models/DisabledCommands"));
const Features_1 = __importDefault(require("../lib/Mongo/Models/Features"));
class DatabaseHandler {
    constructor() {
        this.user = User_1.default;
        this.group = Group_1.default;
        this.session = Session_1.default;
        this.disabledcommands = DisabledCommands_1.default;
        this.feature = Features_1.default;
    }
}
exports.default = DatabaseHandler;
