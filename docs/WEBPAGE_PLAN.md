# Webpage Transformation Plan for Career-Ops

This plan outlines the steps and architecture required to transform the current CLI-based Career-Ops tool into a user-friendly, globally accessible web application.

## 1. Vision and Goals
- **Accessibility**: A responsive web interface that works on desktop and mobile.
- **Ease of Use**: "One-click" job application processing (paste URL -> get result).
- **Multi-User Support**: Secure user accounts to store personal CVs, profiles, and application history.
- **Real-Time Feedback**: Live status updates for long-running AI tasks (evaluation, PDF generation, scanning).
- **Global Deployment**: Hosted on cloud infrastructure for worldwide access.

## 2. Core Architecture
The system will transition from a local file-based CLI tool to a distributed web architecture.

### **Frontend**
- **Framework**: [Next.js](https://nextjs.org/) (React) for its powerful SSR/SSG capabilities and seamless API integration.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a modern, responsive design.
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) for a consistent and professional look.
- **Icons**: [Lucide React](https://lucide.dev/) for intuitive navigation.
- **State Management**: React Context or TanStack Query for data fetching and caching.

### **Backend**
- **API Layer**: A [Go](https://go.dev/) (Gin/Echo) or [Node.js](https://nodejs.org/) (Fastify) backend. 
  - *Recommendation*: Use **Node.js** to leverage existing `.mjs` scripts directly while wrapping them in a secure REST/GraphQL API.
- **Database**: [PostgreSQL](https://www.postgresql.org/) for structured data (applications, users, reports, logs).
- **Job Queue**: [Redis](https://redis.io/) + [BullMQ](https://docs.bullmq.io/) for managing asynchronous tasks like "Auto-Pipeline" and "Portal Scanning".
- **Storage**: [AWS S3](https://aws.amazon.com/s3/) or [Cloudinary](https://cloudinary.com/) for storing generated PDF CVs and markdown reports.

### **Automation Engine**
- **Worker Nodes**: Dedicated containers running [Playwright](https://playwright.dev/) for headless browser automation.
- **AI Integration**: Secure integration with Anthropic's API (Claude) for evaluation and CV tailoring.

## 3. Key Features to Implement

### **Unified Dashboard**
- **Pipeline View**: A sortable, filterable table of all job applications with status indicators (Pending, Applied, Interview, etc.).
- **Quick Add**: A prominent input field to paste a JD URL and trigger the auto-pipeline.
- **Metrics Widget**: Visual summaries (e.g., application counts, success rates, average match scores).

### **Evaluation & PDF Viewer**
- **Interactive Reports**: View AI-generated evaluations with collapsible sections for role summary, CV match, and interview prep.
- **PDF Preview**: In-browser preview of generated ATS-optimized CVs with a "Download" button.

### **Profile & CV Management**
- **Web-Based Editor**: A user-friendly markdown editor for `cv.md` with real-time preview.
- **Form-Based Config**: Easy-to-use forms for updating `profile.yml` and `portals.yml`.

### **Portal Scanner Interface**
- **Scanner Dashboard**: List of job portals with "Run Scan" buttons.
- **Automated Alerts**: Email or browser notifications when new matching jobs are found.

## 4. Proposed Implementation Roadmap

### **Phase 1: API & Data Foundation**
- Design the database schema for users, applications, and reports.
- Create a REST API that wraps existing Node.js scripts (`generate-pdf.mjs`, `verify-pipeline.mjs`, etc.).
- Set up a basic authentication system (e.g., NextAuth.js).

### **Phase 2: MVP Frontend (The "Dashboard")**
- Build the core dashboard UI with application listing and filtering.
- Implement the "Add Application" flow (URL -> API -> Job Queue -> Frontend Notification).
- Enable basic report viewing and PDF downloading.

### **Phase 3: Interactive Features**
- Add the web-based CV and profile editor.
- Implement the "Portal Scanner" interface with real-time progress bars.
- Integrate the "Interview Prep" and "Story Bank" features into a dedicated section.

### **Phase 4: Optimization & Polish**
- Add dark mode support and mobile responsiveness.
- Implement automated tests (unit, integration, and E2E).
- Optimize Playwright workers for faster scanning and PDF generation.

### **Phase 5: Global Deployment**
- Containerize the application using Docker.
- Set up a CI/CD pipeline (e.g., GitHub Actions).
- Deploy to a cloud platform like [Railway](https://railway.app/), [Fly.io](https://fly.io/), or [AWS](https://aws.amazon.com/).

## 5. Security & Privacy Considerations
- **Data Isolation**: Ensure user data is strictly isolated in the database.
- **API Security**: Use JWT for secure API access and rate limiting to prevent abuse.
- **Encryption**: Encrypt sensitive information in the database and use HTTPS for all traffic.
- **Human-in-the-Loop**: Retain the core philosophy where the AI recommends, but the user always takes the final action (e.g., submitting the application).

## 6. Future Enhancements
- **Browser Extension**: A companion extension to "clip" job descriptions directly from LinkedIn/Indeed.
- **LinkedIn Integration**: Automated outreach message generation for recruiters.
- **AI Interview Practice**: Real-time voice/chat interface for practicing interview stories.

---
*Created on 2026-04-07*
