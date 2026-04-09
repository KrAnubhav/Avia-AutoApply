"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfService = exports.PdfService = void 0;
const playwright_1 = require("playwright");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const marked_1 = require("marked");
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const window = new jsdom_1.JSDOM('').window;
const dompurify = (0, dompurify_1.default)(window);
class PdfService {
    templatePath;
    outputPath;
    constructor() {
        this.templatePath = path.join(__dirname, '../../../templates/cv-template.html');
        this.outputPath = path.join(__dirname, '../../../output/pdfs');
        if (!fs.existsSync(this.outputPath)) {
            fs.mkdirSync(this.outputPath, { recursive: true });
        }
    }
    async generate(tailoredCvMarkdown, fileName, profile) {
        const browser = await playwright_1.chromium.launch({ headless: true });
        try {
            const page = await browser.newPage();
            // Convert Markdown to HTML
            const cvHtmlContent = dompurify.sanitize(await marked_1.marked.parse(tailoredCvMarkdown));
            // Read template
            let template = fs.readFileSync(this.templatePath, 'utf-8');
            // Basic template replacements (matching existing project conventions)
            template = template.replace('{{NAME}}', profile.name || 'Candidate');
            template = template.replace('{{LANG}}', profile.lang || 'en');
            template = template.replace('{{PAGE_WIDTH}}', '800px');
            // Inject the content - assuming there's a placeholder or we inject into body
            // Looking at the template structure, we might need a specific placeholder
            // For now, let's wrap the HTML in a div and inject it
            const finalHtml = template.replace('</body>', `<div class="page">${cvHtmlContent}</div></body>`);
            await page.setContent(finalHtml);
            const filePath = path.join(this.outputPath, fileName);
            await page.pdf({
                path: filePath,
                format: 'A4',
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
                printBackground: true,
            });
            return filePath;
        }
        catch (error) {
            console.error('Failed to generate PDF:', error);
            throw new Error('Failed to generate PDF');
        }
        finally {
            await browser.close();
        }
    }
}
exports.PdfService = PdfService;
exports.pdfService = new PdfService();
//# sourceMappingURL=pdf.js.map