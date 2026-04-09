# Phase 2 Technical Specification: Frontend Dashboard

This document outlines the frontend implementation plan for the Career-Ops web application.

## 1. Core Technology Stack
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI (Radix UI)
- **State Management**: TanStack Query (React Query) for API synchronization.
- **Icons**: Lucide React
- **Authentication**: NextAuth.js (configured to use the Phase 1 backend).

---

## 2. Key Pages & Layouts

### **Root Layout**
- Persistent Sidebar: Navigation (Dashboard, Applications, Scanner, Profile, Settings).
- Top Header: Search bar, "Quick Add URL", and User Profile dropdown.

### **Dashboard (Home)**
- **Metrics Overview**:
  - Total Applications
  - Average Match Score
  - Active Interviews
  - Success Rate chart
- **Recent Activity**: List of latest job evaluations and scanner hits.

### **Applications Page**
- **Data Table**:
  - Columns: Company, Title, Score, Status, Created Date.
  - Features: Filtering by status/archetype, sorting, and global search.
- **Application Detail View**:
  - Slide-over or dedicated page.
  - Tabbed interface: **Report** (Evaluation), **CV** (PDF Preview), **Prep** (STAR stories), **Actions** (Update Status, Delete).

### **Scanner Page**
- List of configured portals from `portals.yml`.
- "Run Scan" button for each portal with a live progress indicator.
- List of "New Leads" found by the scanner that haven't been processed yet.

### **Profile & Settings**
- **Career Narrative Editor**: Form-based editing of `profile.yml` fields.
- **Base CV Editor**: Markdown editor (e.g., MDX or simple Textarea) for `cv.md`.
- **Portal Configuration**: Visual editor for `portals.yml`.

---

## 3. API Integration Strategy

### **Next.js Client Components**
Use `fetch` within TanStack Query hooks to interact with the Phase 1 Fastify API (`http://localhost:3001/api`).

### **Server Actions (Optional)**
Use Server Actions for simple form submissions (e.g., updating application status) to improve UX and reduce client-side JS.

### **Real-Time Updates**
- Use **Server-Sent Events (SSE)** or **Polling** to update the UI when a background pipeline job (Auto-Pipeline) finishes.

---

## 4. Design Language
- **Theme**: Dark mode by default (matching the CLI/TUI aesthetic).
- **Colors**: Deep slate/zinc backgrounds with primary accents (e.g., Indigo or Emerald for success).
- **Typography**: Inter or System Sans-serif for readability.

---

## 5. Implementation Roadmap

### **Step 1: Scaffolding**
- Initialize Next.js project in a `client/` or `web/` directory.
- Set up Tailwind and Shadcn UI.
- Configure `NextAuth.js` to point to the Fastify `/api/auth` endpoints.

### **Step 2: Core Dashboard UI**
- Build the Sidebar and Header.
- Implement the main Application table with mock data, then connect to the API.

### **Step 3: Detail Views & Actions**
- Build the Application Detail view.
- Integrate the Markdown renderer for reports.
- Implement the "Update Status" and "Quick Add URL" functionality.

### **Step 4: Profile & CV Editors**
- Build the markdown editor for the CV.
- Create forms for profile management.

---

## 6. Success Metrics for Phase 2
- [ ] User can log in and see their application history.
- [ ] User can paste a URL and see a "Processing" state followed by a new application entry.
- [ ] User can download the generated PDF directly from the browser.
- [ ] User can edit their markdown CV and save it to the database.

---
*Created on 2026-04-07*
