import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import prisma from './utils/prisma';

import authPlugin from './plugins/auth';
import authRoutes from './routes/auth';
import pipelineRoutes from './routes/pipeline';
import './workers/pipeline'; // Initialize worker

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
    },
  },
});

// Register plugins
fastify.register(fastifyCors, {
  origin: '*', // Adjust for production
});

fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret',
});

fastify.register(authPlugin);

// Serve static files (PDFs, reports)
fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), '../output'),
  prefix: '/output/',
});

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(pipelineRoutes, { prefix: '/api' });

// Root route
fastify.get('/', async () => {
  return { status: 'Career-Ops API is running' };
});

// Health check
fastify.get('/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected' };
  } catch (error) {
    return { status: 'error', database: 'disconnected', error: String(error) };
  }
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
