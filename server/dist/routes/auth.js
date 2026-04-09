"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../schemas/auth");
async function authRoutes(fastify) {
    // Register
    fastify.post('/register', async (request, reply) => {
        const { email, password, fullName } = auth_1.registerSchema.parse(request.body);
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return reply.status(400).send({ message: 'User already exists' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                passwordHash,
                fullName,
            },
        });
        const token = fastify.jwt.sign({ userId: user.id });
        return { token, user: { id: user.id, email: user.email, fullName: user.fullName } };
    });
    // Login
    fastify.post('/login', async (request, reply) => {
        const { email, password } = auth_1.loginSchema.parse(request.body);
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return reply.status(401).send({ message: 'Invalid credentials' });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            return reply.status(401).send({ message: 'Invalid credentials' });
        }
        const token = fastify.jwt.sign({ userId: user.id });
        return { token, user: { id: user.id, email: user.email, fullName: user.fullName } };
    });
    // Get current user profile
    fastify.get('/me', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const user = await prisma_1.default.user.findUnique({
            where: { id: request.user.userId },
            select: { id: true, email: true, fullName: true, profileJson: true, cvMarkdown: true },
        });
        return user;
    });
    // Update profile and CV
    fastify.put('/profile', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.user.userId;
        const { cvMarkdown, profileJson } = request.body;
        const updatedUser = await prisma_1.default.user.update({
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
        const userId = request.user.userId;
        return prisma_1.default.storyBank.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
    });
    fastify.post('/stories', { preValidation: [fastify.authenticate] }, async (request) => {
        const userId = request.user.userId;
        const { title, content, tags } = request.body;
        return prisma_1.default.storyBank.create({
            data: { userId, title, content, tags }
        });
    });
    fastify.delete('/stories/:id', { preValidation: [fastify.authenticate] }, async (request) => {
        const { id } = request.params;
        const userId = request.user.userId;
        return prisma_1.default.storyBank.delete({ where: { id, userId } });
    });
}
//# sourceMappingURL=auth.js.map