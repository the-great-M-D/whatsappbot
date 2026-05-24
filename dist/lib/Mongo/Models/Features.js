"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const FeatureSchema = new mongoose_1.Schema({
    feature: { type: String, required: true, unique: true },
    state: {
        type: Boolean,
        required: false,
        default: true
    }
});
// change name
exports.default = (0, mongoose_1.model)('feature', FeatureSchema);
