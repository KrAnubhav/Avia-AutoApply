"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipelineService = exports.PipelineService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const sdk_1 = require("@anthropic-ai/sdk");
const anthropic = new sdk_1.Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || '',
});
class PipelineService {
    prisma;
    constructor() {
        this.prisma = prisma_1.default;
    }
    async processUrl(jobId, userId, url, archetype) {
        try {
            // Update job status to PROCESSING
            await this.prisma.jobQueue.update({
                where: { id: jobId },
                data: { status: 'PROCESSING' },
            });
            console.log(`Processing URL: ${url} for user: ${userId}`);
            // Step 0: Extract JD (Mocked for now, will use Playwright in full implementation)
            const jdText = await this.extractJd(url);
            // Step 1: Evaluate (Mocked evaluation for Phase 1)
            const evaluation = await this.evaluateJd(jdText, userId, archetype);
            // Step 2: Create Application entry
            const application = await this.prisma.application.create({
                data: {
                    userId,
                    companyName: evaluation.companyName,
                    jobTitle: evaluation.jobTitle,
                    jdUrl: url,
                    status: 'PENDING',
                    score: evaluation.score,
                    archetype: evaluation.archetype,
                },
            });
            // Step 3: Create Report entry
            await this.prisma.report.create({
                data: {
                    applicationId: application.id,
                    summary: evaluation.summary,
                    cvMatch: evaluation.cvMatch,
                    levelStrategy: evaluation.levelStrategy,
                    compResearch: evaluation.compResearch,
                    interviewPrep: evaluation.interviewPrep,
                    rawMarkdown: evaluation.rawMarkdown,
                },
            });
            // Step 4: Generate PDF (Mocked path for now)
            const pdfPath = `cv-candidate-${evaluation.companyName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
            await this.prisma.application.update({
                where: { id: application.id },
                data: { pdfPath },
            });
            // Update job status to COMPLETED
            await this.prisma.jobQueue.update({
                where: { id: jobId },
                data: {
                    status: 'COMPLETED',
                    resultUrl: `/api/applications/${application.id}`,
                },
            });
            return application;
        }
        catch (error) {
            console.error('Pipeline error:', error);
            await this.prisma.jobQueue.update({
                where: { id: jobId },
                data: {
                    status: 'FAILED',
                    errorLog: String(error),
                },
            });
            throw error;
        }
    }
    async extractJd(url) {
        // In a real implementation, this would use Playwright
        return "Sample Job Description text extracted from " + url;
    }
    async evaluateJd(jdText, userId, archetype) {
        // In a real implementation, this would call Claude API
        // For now, returning mock data
        return {
            companyName: "Example Corp",
            jobTitle: "Senior Software Engineer",
            score: 4.2,
            archetype: archetype || "Backend",
            summary: "A great role for someone with backend experience.",
            cvMatch: "Strong match on Node.js and Go.",
            levelStrategy: "Apply as Senior/Staff level.",
            compResearch: "Estimated $150k - $200k base.",
            interviewPrep: "Focus on STAR stories about scaling systems.",
            rawMarkdown: "# Evaluation Report\n\nFull markdown content here...",
        };
    }
}
exports.PipelineService = PipelineService;
exports.pipelineService = new PipelineService();
//# sourceMappingURL=pipeline.js.map