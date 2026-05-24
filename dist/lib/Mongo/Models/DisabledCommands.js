"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const DisabledCommandSchema = new mongoose_1.Schema({
    command: {
        type: String,
        unique: true,
        required: true
    },
    reason: {
        type: String,
        required: false
    }
});
exports.default = (0, mongoose_1.model)('disabledcommands', DisabledCommandSchema);
