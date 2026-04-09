"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scraperService = exports.ScraperService = void 0;
const playwright_1 = require("playwright");
class ScraperService {
    async scrape(url) {
        const browser = await playwright_1.chromium.launch({ headless: true });
        try {
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle' });
            // Common selectors for JD text on Lever, Ashby, Greenhouse, etc.
            // We also fallback to getting the whole body text if specific selectors fail
            const selectors = [
                '.job-description',
                '#job-description',
                '.description',
                '[data-automation-id="jobPostingDescription"]',
                '.content',
                'main'
            ];
            let jdText = '';
            for (const selector of selectors) {
                const element = await page.$(selector);
                if (element) {
                    jdText = await element.innerText();
                    break;
                }
            }
            if (!jdText) {
                jdText = await page.innerText('body');
            }
            return jdText.trim();
        }
        catch (error) {
            console.error(`Failed to scrape ${url}:`, error);
            throw new Error(`Failed to scrape ${url}`);
        }
        finally {
            await browser.close();
        }
    }
}
exports.ScraperService = ScraperService;
exports.scraperService = new ScraperService();
//# sourceMappingURL=scraper.js.map