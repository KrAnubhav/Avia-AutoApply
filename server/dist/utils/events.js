"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitPipelineStatus = exports.pipelineEvents = void 0;
const events_1 = require("events");
exports.pipelineEvents = new events_1.EventEmitter();
const emitPipelineStatus = (jobId, status, progress, message) => {
    exports.pipelineEvents.emit(`status:${jobId}`, { status, progress, message });
};
exports.emitPipelineStatus = emitPipelineStatus;
//# sourceMappingURL=events.js.map