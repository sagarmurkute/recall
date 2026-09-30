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

## ⚙️ Environment Variables & Local Development

### Client (`.env.local` / Vite)
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsIn..."
```

### Server / Edge Secrets (`supabase/.env` or Dashboard Secrets)
```env
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-2.5-flash"
GEMINI_EMBEDDING_MODEL="text-embedding-004"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsIn..."
```

---

## 🚦 Current Project Status

* **Status:** **PHASE 0: Documentation & Architecture Complete**
* **Application Code Status:** No application code has been generated yet. All foundational specifications are locked and ready for implementation starting in **PHASE 1 (Supabase Foundation)**.
