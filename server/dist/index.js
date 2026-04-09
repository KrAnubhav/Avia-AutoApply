"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("./plugins/auth"));
const auth_2 = __importDefault(require("./routes/auth"));
const pipeline_1 = __importDefault(require("./routes/pipeline"));
require("./workers/pipeline"); // Initialize worker
dotenv_1.default.config();
const fastify = (0, fastify_1.default)({
    logger: {
        transport: {
            target: 'pino-pretty',
        },
    },
});
const prisma = new client_1.PrismaClient();
// Register plugins
fastify.register(cors_1.default, {
    origin: '*', // Adjust for production
});
fastify.register(jwt_1.default, {
    secret: process.env.JWT_SECRET || 'supersecret',
});
fastify.register(auth_1.default);
// Serve static files (PDFs, reports)
fastify.register(static_1.default, {
    root: path_1.default.join(__dirname, '../../../output'),
    prefix: '/output/',
});
// Register routes
fastify.register(auth_2.default, { prefix: '/api/auth' });
fastify.register(pipeline_1.default, { prefix: '/api' });
// Root route
fastify.get('/', async () => {
    return { status: 'Career-Ops API is running' };
});
// Health check
fastify.get('/health', async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return { status: 'ok', database: 'connected' };
    }
    catch (error) {
        return { status: 'error', database: 'disconnected', error: String(error) };
    }
});
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3001');
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on http://localhost:${port}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map