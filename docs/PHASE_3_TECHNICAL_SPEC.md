# Phase 3 Technical Specification: AI Engine & PDF Automation

This document provides a detailed technical blueprint for Phase 3 of the Career-Ops web transformation. This phase focuses on connecting the web interface to the actual AI reasoning and PDF generation logic.

## 1. Goal
Transition the current "mocked" pipeline into a fully functional engine that:
- Scrapes job descriptions from URLs in real-time.
- Performs multi-dimensional AI evaluations using Claude.
- Generates ATS-optimized PDF CVs tailored to specific job descriptions.
- Synchronizes all data back to the SQLite database.

---

## 2. Automation Engine (Scraping & AI)

### **URL Scraping (Playwright)**
- **Service**: `ScraperService` in the backend.
- **Implementation**: Initialize a headless Chromium instance via Playwright.
- **Logic**: 
  - Navigate to the JD URL.
  - Wait for dynamic content to load (critical for Ashby/Lever/Greenhouse).
  - Extract text using selectors or a simplified markdown snapshot.

### **AI Evaluation (Anthropic Claude)**
- **Service**: `AiService` in the backend.
- **Prompts**: Migrate existing prompts from `modes/oferta.md` and `modes/auto-pipeline.md`.
- **Logic**:
  - Input: User's `cvMarkdown` + User's `profileJson` + Extracted `jdText`.
  - Output: Structured JSON containing:
    - `companyName`, `jobTitle`, `score` (1-5).
    - Blocks A-F: Summary, CV Match, Level Strategy, Comp, Prep stories.

---

## 3. PDF Generation Pipeline

### **Puppeteer/Playwright PDF Engine**
- **Service**: `PdfService` in the backend.
- **Template**: Reuse `templates/cv-template.html`.
- **Logic**:
  - AI generates "Tailored CV Markdown" based on the job description.
  - Backend converts Markdown to HTML using the template.
  - Playwright renders the HTML and exports as a PDF.
- **Storage**: Save generated PDFs to `server/output/pdfs/` and serve via `fastify-static`.

---

## 4. Job Queue & Real-Time Updates

### **BullMQ Worker Refinement**
- The worker created in Phase 1 will be updated to execute the full sequence:
  1. `ScraperService.scrape(url)`
  2. `AiService.evaluate(jd, cv)`
  3. `PdfService.generate(evaluation, cv)`
  4. `Database.save(results)`

### **SSE (Server-Sent Events)**
- **Endpoint**: `GET /api/pipeline/events/:jobId`.
- **Frontend**: The "Analyze" button will trigger a listener that shows real-time steps:
  - 🔍 Scaping JD...
  - 🤖 AI Evaluating...
  - 📄 Generating PDF...
  - ✅ Done!

---

## 5. Security & Rate Limiting
- **API Key Management**: Claude API keys will be stored in `server/.env` and never exposed to the frontend.
- **Concurrency**: Limit Playwright to 2-3 simultaneous browser instances to prevent CPU spikes on the host.
- **Caching**: If a URL has been analyzed by the same user in the last 24 hours, offer to reuse the existing report.

---

## 6. Implementation Roadmap

### **Step 1: Scraper Integration**
- Implement `ScraperService` using Playwright.
- Test with common job boards (LinkedIn, Lever, Greenhouse).

### **Step 2: AI Logic Migration**
- Implement `AiService` using `@anthropic-ai/sdk`.
- Port the evaluation prompts from the CLI tool.

### **Step 3: PDF Pipeline**
- Implement `PdfService` to generate PDFs from AI-tailored markdown.
- Configure static file serving for the web frontend to download PDFs.

### **Step 4: Real-Time UI**
- Add progress tracking to the BullMQ worker.
- Implement the SSE endpoint and update the frontend "Analyze" button with a multi-step progress bar.

---

## 7. Success Metrics for Phase 3
- [ ] Real job URLs are successfully scraped and analyzed.
- [ ] Claude returns structured evaluations that appear in the Detail View.
- [ ] Users can download a PDF that was generated in real-time for a specific JD.
- [ ] The dashboard reflects accurate scores and data without manual entry.

---
*Created on 2026-04-07*
