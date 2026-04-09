"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const pipeline_1 = require("../services/pipeline");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pipelineWorker = new bullmq_1.Worker('pipeline', async (job) => {
    const { jobId, userId, url, archetype } = job.data;
    console.log(`Worker processing job ${job.id}: ${url}`);
    await pipeline_1.pipelineService.processUrl(jobId, userId, url, archetype);
}, {
    connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
});
pipelineWorker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed!`);
});
pipelineWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} has failed with ${err.message}`);
});
console.log('Pipeline worker started...');
exports.default = pipelineWorker;
//# sourceMappingURL=pipeline.js.map