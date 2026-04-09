import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { registerSchema, loginSchema } from '../schemas/auth';

export default async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, fullName } = registerSchema.parse(request.body);

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(400).send({ message: 'User already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName,
        },
      });

      const token = fastify.jwt.sign({ userId: user.id });
      return { token, user: { id: user.id, email: user.email, fullName: user.fullName } };
    } catch (error: any) {
      fastify.log.error('Registration error:', error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ message: 'Validation failed', errors: error.errors });
      }
      return reply.status(500).send({ 
        message: 'Internal server error during registration', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      });
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(401).send({ message: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return reply.status(401).send({ message: 'Invalid credentials' });
      }

      const token = fastify.jwt.sign({ userId: user.id });
      return { token, user: { id: user.id, email: user.email, fullName: user.fullName } };
    } catch (error: any) {
      fastify.log.error('Login error:', error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ message: 'Validation failed', errors: error.errors });
      }
      return reply.status(500).send({ 
        message: 'Internal server error during login', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      });
    }
  });

  // Get current user profile
  fastify.get('/me', { preValidation: [fastify.authenticate] }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: (request.user as any).userId },
      select: { id: true, email: true, fullName: true, profileJson: true, cvMarkdown: true },
    });
    return user;
  });

  // Update profile and CV
  fastify.put('/profile', { preValidation: [fastify.authenticate] }, async (request) => {
    const userId = (request.user as any).userId;
    const { cvMarkdown, profileJson } = request.body as { cvMarkdown?: string; profileJson?: any };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        cvMarkdown,
        profileJson,
      },
      select: { id: true, email: true, fullName: true, profileJson: true, cvMarkdown: true },
    });

    return updatedUser;
  });

  // Story Bank Routes
  fastify.get('/stories', { preValidation: [fastify.authenticate] }, async (request) => {
    const userId = (request.user as any).userId;
    return (prisma as any).storyBank.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  });

  fastify.post('/stories', { preValidation: [fastify.authenticate] }, async (request) => {
    const userId = (request.user as any).userId;
    const { title, content, tags } = request.body as { title: string; content: string; tags?: string };
    return (prisma as any).storyBank.create({
      data: { userId, title, content, tags }
    });
  });

  fastify.delete('/stories/:id', { preValidation: [fastify.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const userId = (request.user as any).userId;
    return (prisma as any).storyBank.delete({ where: { id, userId } });
  });
}
