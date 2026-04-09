"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = pipelineRoutes;
const bullmq_1 = require("bullmq");
const prisma_1 = __importDefault(require("../utils/prisma"));
const pipeline_1 = require("../schemas/pipeline");
const pipelineQueue = new bullmq_1.Queue('pipeline', {
    connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
});
async function pipelineRoutes(fastify) {
    // Trigger auto-pipeline for a URL
    fastify.post('/process', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { url, archetype } = pipeline_1.processUrlSchema.parse(request.body);
        const userId = request.user.userId;
        // Create a job queue entry in the database
        const jobEntry = await prisma_1.default.jobQueue.create({
            data: {
                userId,
                type: 'AUTO_PIPELINE',
                status: 'QUEUED',
            },
        });
        // Add job to BullMQ
        const job = await pipelineQueue.add('auto-pipeline', {
            jobId: jobEntry.id,
            userId,
            url,
            archetype,
        });
        return { jobId: jobEntry.id, bullJobId: job.id };
    });
    // Get job status
    fastify.get('/status/:jobId', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { jobId } = request.params;
        const job = await prisma_1.default.jobQueue.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            return reply.status(404).send({ message: 'Job not found' });
        }
        return job;
    });
    // List all jobs for the user
    fastify.get('/jobs', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.user.userId;
        const jobs = await prisma_1.default.jobQueue.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return jobs;
    });
}
//# sourceMappingURL=pipeline.js.map