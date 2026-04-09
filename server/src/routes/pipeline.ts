import { FastifyInstance } from 'fastify';
import { Queue } from 'bullmq';
import prisma from '../utils/prisma';
import { processUrlSchema } from '../schemas/pipeline';

const pipelineQueue = new Queue('pipeline', {
  connection: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
});

import { aiService } from '../services/ai';
import { pipelineEvents } from '../utils/events';

export default async function pipelineRoutes(fastify: FastifyInstance) {
  // SSE for job status updates
  fastify.get('/status/:jobId/events', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    const onStatusUpdate = (data: any) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    pipelineEvents.on(`status:${jobId}`, onStatusUpdate);

    request.raw.on('close', () => {
      pipelineEvents.off(`status:${jobId}`, onStatusUpdate);
    });
  });

  // Trigger auto-pipeline for a URL
  fastify.post('/process', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { url, archetype } = processUrlSchema.parse(request.body);
    const userId = (request.user as any).userId;

    // Create a job queue entry in the database
    const jobEntry = await prisma.jobQueue.create({
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
    const { jobId } = request.params as { jobId: string };
    const job = await prisma.jobQueue.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return reply.status(404).send({ message: 'Job not found' });
    }

    return job;
  });

  // List all jobs for the user
  fastify.get('/jobs', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const jobs = await prisma.jobQueue.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return jobs;
  });

  // Get application details with report
  fastify.get('/applications/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const application = await prisma.application.findUnique({
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
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    const updated = await prisma.application.update({
      where: { id },
      data: { status },
    });

    return updated;
  });

  // Get all applications for the user
  fastify.get('/applications', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return applications;
  });

  // Generate negotiation script
  fastify.post('/applications/:id/negotiate', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = (request.user as any).userId;

    const application = await prisma.application.findUnique({
      where: { id },
      include: { report: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!application || !user) {
      return reply.status(404).send({ message: 'Application or user not found' });
    }

    const script = await aiService.generateNegotiationScript(application, user.profileJson);
    return { script };
  });
}
