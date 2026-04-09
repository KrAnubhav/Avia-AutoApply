# Phase 1 Technical Specification: API & Data Foundation

This document provides a detailed technical blueprint for Phase 1 of the Career-Ops web transformation.

## 1. Backend Architecture
The backend will be built using **Node.js (Fastify)**. This choice allows for:
- Seamless execution of existing `.mjs` scripts (`generate-pdf.mjs`, `verify-pipeline.mjs`).
- Fast, low-overhead API performance.
- Direct integration with the project's existing Node.js environment.

### **Core Modules**
- **Fastify**: The main web server framework.
- **Prisma**: An ORM for PostgreSQL to ensure type-safe database interactions.
- **BullMQ**: A Redis-backed job queue for processing long-running AI tasks.
- **NextAuth.js**: (In the Next.js frontend) to handle user sessions and identity.

---

## 2. Database Schema (PostgreSQL)

### **Table: Users**
Stores user information and authentication credentials.
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `password_hash`: String
- `full_name`: String
- `profile_json`: JSON (Replaces `config/profile.yml`)
- `created_at`: DateTime
- `updated_at`: DateTime

### **Table: Applications**
Stores individual job applications (Replaces `data/applications.md`).
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key)
- `company_name`: String
- `job_title`: String
- `jd_url`: String
- `status`: Enum (Pending, Applied, Interviewing, Rejected, Offer)
- `score`: Decimal (1.0 - 5.0)
- `archetype`: String (e.g., Backend, Frontend)
- `report_id`: UUID (Foreign Key, Optional)
- `pdf_path`: String (S3/Cloudinary URL)
- `created_at`: DateTime
- `updated_at`: DateTime

### **Table: Reports**
Stores detailed AI evaluations (Replaces `reports/*.md`).
- `id`: UUID (Primary Key)
- `application_id`: UUID (Foreign Key)
- `summary`: Text
- `cv_match`: Text
- `level_strategy`: Text
- `comp_research`: Text
- `interview_prep`: Text (STAR stories)
- `raw_markdown`: Text

### **Table: JobQueue**
Tracks the status of background tasks.
- `id`: UUID
- `user_id`: UUID
- `type`: Enum (AUTO_PIPELINE, SCANNER, PDF_GEN)
- `status`: Enum (Queued, Processing, Completed, Failed)
- `result_url`: String (Optional)
- `error_log`: Text

---

## 3. API Endpoint Definition

### **Authentication**
- `POST /api/auth/register`: Create a new account.
- `POST /api/auth/login`: Authenticate and receive a JWT.

### **Applications (CRUD)**
- `GET /api/applications`: List all applications for the current user.
- `POST /api/applications`: Manually create a new application entry.
- `GET /api/applications/:id`: Fetch details for a specific application + report.
- `PATCH /api/applications/:id`: Update status, company, or title.
- `DELETE /api/applications/:id`: Remove an application record.

### **The Auto-Pipeline (Core Engine)**
- `POST /api/pipeline/process`: Accepts a JD URL.
  - Triggers a BullMQ job.
  - Executes `Playwright` to scrape the URL.
  - Calls `Claude API` for evaluation.
  - Generates a PDF via `generate-pdf.mjs`.
  - Saves all results to the database.

### **Profile & CV Management**
- `GET /api/profile`: Retrieve the user's career profile and current CV.
- `PUT /api/profile`: Update the profile (replaces `profile.yml`).
- `PUT /api/cv`: Update the markdown CV (replaces `cv.md`).

---

## 4. Integration with Existing Logic
To reuse the current `.mjs` scripts efficiently, we will:
1.  **Refactor Utility Functions**: Extract core logic from scripts like `generate-pdf.mjs` into shared TypeScript/JavaScript modules that the API can import.
2.  **Shell Execution**: Use Node's `child_process` to run complex commands like `/career-ops scan` if they aren't easily refactorable.
3.  **Unified Data Bridge**: Create a migration script that imports existing data from `applications.md` and `reports/` into the new PostgreSQL database.

---

## 5. Security & Isolation
- **User Ownership**: Every database query will include a `WHERE user_id = current_user_id` clause.
- **Encrypted Storage**: Sensitive fields in `profile_json` (if any) will be encrypted at rest.
- **CORS & Rate Limiting**: The API will be restricted to the Next.js frontend and include strict rate limits for AI-heavy endpoints.

---

## 6. Success Metrics for Phase 1
- [ ] Database successfully connected and tables migrated.
- [ ] Authentication system functional (Login/Register).
- [ ] "Add Application" API successfully processes a URL and stores the result in PostgreSQL.
- [ ] Report viewing endpoint returns structured JSON data from the DB.

---
*Created on 2026-04-07*
