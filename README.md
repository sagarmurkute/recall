# Recall

> **"You already have the answer. Recall finds it."**

Recall is an AI-powered personal digital memory and retrieval engine built for students. It ingests messy, unstructured artifacts—course syllabi, lecture slide PDFs, whiteboard screenshots, assignment rubrics, and text notes—and allows users to ask natural-language questions, returning verified answers grounded strictly in their uploaded sources with 1-click original context verification.

---

## 📌 The Problem
Students accumulate hundreds of information fragments every semester across PDFs, screenshots, lecture notes, emails, and group chats. When deadlines approach or exams begin, they waste significant time hunting for specific formulas, project requirements, or late policies. Traditional file search requires exact keywords, and generic AI chatbots hallucinate generic answers rather than referencing the student's actual course materials.

---

## 💡 The Solution
Recall serves as an active personal memory engine:
1. **Multi-Modal Ingestion:** Ingests PDFs, PNG/JPG screenshots, and text notes into secure **Supabase Storage**.
2. **Deterministic Retrieval:** Uses PostgreSQL **Hybrid Search** (`pgvector` + Full-Text Search `tsvector`) to locate relevant content chunks before involving generative AI.
3. **Grounded Gemini Synthesis:** Invokes **Google Gemini** via secure server-side Supabase Edge Functions, strictly enforcing a distinction between **Verified Direct Quotes** and **AI Explanations**.
4. **Instant Verification:** Links every fact directly to its original source page or screenshot view via temporary signed URLs.

---

## 🎬 Core Demo Scenario (BuildX Hackathon)

* **Context:** A student uploads their semester files (`DBMS_Course_Syllabus.pdf`, `BuildX_Hackathon_Schedule.png`, `College_Timetable_Fall.pdf`, `Merit_Scholarship_Notice.png`).
* **Query:** *"When is my DBMS assignment due?"*
* **Recall Behavior:**
  1. Retrieves the exact chunk from `DBMS_Course_Syllabus.pdf` (Page 2).
  2. Displays the **Verified Direct Quote**: *"DBMS Assignment 2 is due Thursday, October 24 at 11:59 PM"*.
  3. Displays a concise AI synthesis of the submission rules and 10% daily late penalty.
  4. Provides a 1-click citation chip opening the original syllabus PDF directly to page 2 with highlighted text.

---

## 🛠️ Technology Architecture

* **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Lucide React, Radix UI Primitives
* **Backend & Auth:** Supabase Auth, PostgreSQL, Row Level Security (RLS), Supabase Edge Functions
* **Storage:** Supabase Storage (Private `user_files` bucket with signed URL access)
* **Search Engine:** Hybrid Search via PostgreSQL (`pgvector` for 768-dim embeddings + `tsvector` for lexical search)
* **AI Provider:** Google Gemini (configurable `GEMINI_MODEL` and `GEMINI_EMBEDDING_MODEL` via server-side Edge Functions)
* **Security:** Strict RLS tenant isolation; zero client-side exposure of Gemini API keys or Supabase service-role secrets

---

## 📁 Repository Structure & Documentation Index

```
buildx/
├── README.md                  # Project overview, architecture, and documentation index
├── .env.example               # Environment variables template
├── package.json               # Dependencies and build scripts
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS design system
├── src/
│   ├── lib/
│   │   ├── supabase.ts        # Typed Supabase client (anon key only)
│   │   └── status.ts          # Live backend connection diagnostic
│   ├── services/              # Service layer for database entities
│   │   ├── collectionsService.ts
│   │   ├── sourcesService.ts
│   │   ├── documentsService.ts
│   │   ├── searchHistoryService.ts
│   │   └── profileService.ts
│   ├── types/                 # Database and entity TypeScript types
│   │   ├── database.ts
│   │   └── index.ts
│   ├── App.tsx                # Main React application entry
│   └── main.tsx               # DOM mount point
├── supabase/
│   └── migrations/
│       └── 20261001000000_recall_initial_schema.sql  # Phase 1 Initial SQL Migration
└── docs/
    ├── PRODUCT_VISION.md      # Philosophy, core principles, and boundaries
    ├── PRD.md                 # Product requirements, personas, and feature matrix
    ├── USER_FLOWS.md          # 10-step MVP flow and user journey maps
    ├── AI_SPEC.md             # Gemini integration, prompts, and grounding protocols
    ├── TECH_SPEC.md           # Architecture, frontend, backend, and security rules
    ├── SUPABASE_SCHEMA.md     # SQL tables, RLS policies, indexes, and storage schema
    ├── UI_SPEC.md             # Design tokens, 7 hackathon screens, and component specs
    ├── ROADMAP.md             # 9-phase roadmap from Hackathon MVP to Production
    └── DEMO_SCRIPT.md         # 2-minute and 3-minute live presentation scripts
```

---

## 🚀 Local Setup & Quickstart Guide

### 1. Prerequisites
* **Node.js:** v18.0 or newer (v24.x recommended)
* **npm:** v9.0 or newer
* **Supabase Account:** Free account at [supabase.com](https://supabase.com) (or local Supabase CLI)

---

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```

Open `.env.local` and configure your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> ⚠️ **Security Reminder:** Never place Supabase `service_role` keys or Gemini API keys inside `.env.local`. Client code must strictly use `VITE_SUPABASE_ANON_KEY`.

---

### 3. Run Database Migration
1. Go to your **Supabase Dashboard** → **SQL Editor**.
2. Open [`supabase/migrations/20261001000000_recall_initial_schema.sql`](file:///c:/Users/Sagar/Desktop/buildx/supabase/migrations/20261001000000_recall_initial_schema.sql).
3. Paste and run the migration script. This will create:
   - Tables: `profiles`, `collections`, `sources`, `documents`, `document_chunks`, `search_history`
   - Row Level Security (RLS) policies on all tables
   - Foreign keys, performance indexes, and Full-Text Search GIN index
   - Automatic profile creation trigger upon `auth.users` signup
   - Private storage bucket `user_files` with storage RLS policies

---

### 4. Configure Supabase Storage
Verify in **Supabase Dashboard** → **Storage**:
* A private bucket named `user_files` is created.
* Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`, `text/plain`, `text/markdown`.
* Maximum file size: `25MB`.

---

### 5. Start Development Server
```bash
npm install
npm run dev
```

Visit `http://localhost:5173` to see the live Supabase Connection Diagnostic.

---

## 🚦 Current Implementation Status

* **Status:** **PHASE 1: Supabase Foundation Complete ✅**
* **Completed in Phase 1:**
  - Initialized React 19 + Vite + TypeScript + Tailwind CSS project
  - Configured typed `@supabase/supabase-js` client with environment guards
  - Created complete PostgreSQL initial migration with strict RLS policies and indexes
  - Created private Supabase Storage bucket configuration (`user_files`)
  - Created structured TypeScript database entity types and service layer (`src/services/`)
  - Built live Supabase connection diagnostic interface in `src/App.tsx`
* **Next Phase:** **PHASE 2: Core Upload & Storage** (Multi-modal drag-and-drop ingestion).
