import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
}
