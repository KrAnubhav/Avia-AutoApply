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
const ai_1 = require("../services/ai");
const events_1 = require("../utils/events");
async function pipelineRoutes(fastify) {
    // SSE for job status updates
    fastify.get('/status/:jobId/events', async (request, reply) => {
        const { jobId } = request.params;
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');
        const onStatusUpdate = (data) => {
            reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
        };
        events_1.pipelineEvents.on(`status:${jobId}`, onStatusUpdate);
        request.raw.on('close', () => {
            events_1.pipelineEvents.off(`status:${jobId}`, onStatusUpdate);
        });
    });
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
    // Get application details with report
    fastify.get('/applications/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const application = await prisma_1.default.application.findUnique({
            where: { id },
            include: { report: true },
        });
        if (!application) {
            return reply.status(404).send({ message: 'Application not found' });
        }
        return application;
    });
    // Update application status
    fastify.patch('/applications/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const { status } = request.body;
        const updated = await prisma_1.default.application.update({
            where: { id },
            data: { status },
        });
        return updated;
    });
    // Get all applications for the user
    fastify.get('/applications', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.user.userId;
        const applications = await prisma_1.default.application.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return applications;
    });
    // Generate negotiation script
    fastify.post('/applications/:id/negotiate', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const userId = request.user.userId;
        const application = await prisma_1.default.application.findUnique({
            where: { id },
            include: { report: true },
        });
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!application || !user) {
            return reply.status(404).send({ message: 'Application or user not found' });
        }
        const script = await ai_1.aiService.generateNegotiationScript(application, user.profileJson);
        return { script };
    });
}
//# sourceMappingURL=pipeline.js.map