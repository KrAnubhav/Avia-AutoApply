import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const dompurify = createDOMPurify(window);

export class PdfService {
  private templatePath: string;
  private outputPath: string;

  constructor() {
    this.templatePath = path.join(__dirname, '../../../templates/cv-template.html');
    this.outputPath = path.join(__dirname, '../../../output/pdfs');
    
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  async generate(tailoredCvMarkdown: string, fileName: string, profile: any): Promise<string> {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      
      // Convert Markdown to HTML
      const cvHtmlContent = dompurify.sanitize(await marked.parse(tailoredCvMarkdown));
      
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
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw new Error('Failed to generate PDF');
    } finally {
      await browser.close();
    }
  }
}

export const pdfService = new PdfService();
