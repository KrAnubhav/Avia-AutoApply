"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipelineService = exports.PipelineService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const scraper_1 = require("./scraper");
const ai_1 = require("./ai");
const pdf_1 = require("./pdf");
const events_1 = require("../utils/events");
class PipelineService {
    prisma;
    constructor() {
        this.prisma = prisma_1.default;
    }
    async processUrl(jobId, userId, url, archetype) {
        try {
            (0, events_1.emitPipelineStatus)(jobId, 'PROCESSING', 10, 'Initializing pipeline...');
            // 1. Update job status to PROCESSING
            await this.prisma.jobQueue.update({
                where: { id: jobId },
                data: { status: 'PROCESSING' },
            });
            // 2. Fetch User Profile and CV
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user || !user.cvMarkdown) {
                throw new Error('User CV or profile not found');
            }
            (0, events_1.emitPipelineStatus)(jobId, 'SCRAPING', 20, 'Navigating to job portal...');
            console.log(`[Job ${jobId}] Starting scraping for ${url}`);
            // 3. Step 0: Extract JD using Playwright
            const jdText = await scraper_1.scraperService.scrape(url);
            (0, events_1.emitPipelineStatus)(jobId, 'SCRAPING', 40, 'Job description extracted');
            console.log(`[Job ${jobId}] Scraping completed`);
            // 4. Step 1 & 2: Evaluate JD with AI and Generate Report
            (0, events_1.emitPipelineStatus)(jobId, 'AI_EVALUATION', 50, 'Analyzing fit with Claude AI...');
            console.log(`[Job ${jobId}] Starting AI evaluation`);
            const evaluation = await ai_1.aiService.evaluate(jdText, user.cvMarkdown, user.profileJson || {}, archetype);
            (0, events_1.emitPipelineStatus)(jobId, 'AI_EVALUATION', 70, 'Evaluation complete');
            console.log(`[Job ${jobId}] AI evaluation completed`);
            // 5. Create Application entry
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
            // 6. Create Report entry
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
            // 7. Step 3: Tailor CV and Generate PDF
            (0, events_1.emitPipelineStatus)(jobId, 'CV_TAILORING', 80, 'Optimizing CV for ATS...');
            console.log(`[Job ${jobId}] Starting PDF generation`);
            const tailoredCvMarkdown = await ai_1.aiService.tailorCv(jdText, user.cvMarkdown);
            (0, events_1.emitPipelineStatus)(jobId, 'PDF_GENERATION', 90, 'Rendering professional PDF...');
            const pdfFileName = `cv-${evaluation.companyName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
            const profile = user.profileJson;
            await pdf_1.pdfService.generate(tailoredCvMarkdown, pdfFileName, profile || {});
            const pdfPath = `/output/pdfs/${pdfFileName}`;
            await this.prisma.application.update({
                where: { id: application.id },
                data: { pdfPath },
            });
            console.log(`[Job ${jobId}] PDF generation completed`);
            (0, events_1.emitPipelineStatus)(jobId, 'COMPLETE', 100, 'All done!');
            // 8. Update job status to COMPLETED
            await this.prisma.jobQueue.update({
                where: { id: jobId },
                data: {
                    status: 'COMPLETED',
                    resultUrl: `/applications/${application.id}`,
                },
            });
            return application;
        }
        catch (error) {
            console.error(`[Job ${jobId}] Pipeline error:`, error);
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
}
exports.PipelineService = PipelineService;
exports.pipelineService = new PipelineService();
//# sourceMappingURL=pipeline.js.map