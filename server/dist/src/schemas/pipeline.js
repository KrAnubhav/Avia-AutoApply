"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUrlSchema = void 0;
const zod_1 = require("zod");
exports.processUrlSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    archetype: zod_1.z.string().optional(),
});
//# sourceMappingURL=pipeline.js.map