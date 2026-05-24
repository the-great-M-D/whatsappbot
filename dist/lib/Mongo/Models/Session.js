"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SessionSchema = new mongoose_1.Schema({
    ID: {
        type: String,
        required: true,
        unique: true
    },
    session: {
        type: Object,
        required: false,
        unique: true
    }
});
exports.default = (0, mongoose_1.model)('session', SessionSchema);
