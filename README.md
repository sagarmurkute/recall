# Recall

> **"You already encountered the information. Recall helps you find it again."**

Recall is an AI-powered **personal memory system** designed to solve the universal human problem:
> *"I remember seeing this somewhere. Where was it?"*

Recall unifies two complementary memory streams into a single, verifiable cognitive index:
1. **Explicit Memory:** Documents, syllabi, PDFs, whiteboard photos, screenshots, and text notes intentionally saved by the user.
2. **Contextual Memory:** Ambient digital encounters (active applications, visited browser tabs, opened files, and timestamps) observed locally through **TRACE** (`Trace.exe` — a privacy-first Windows desktop agent).

---

## 💡 The Dual-Memory Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          UNIFIED MEMORY ENGINE                              │
├──────────────────────────────────────┬──────────────────────────────────────┤
│       1. EXPLICIT MEMORY             │       2. CONTEXTUAL MEMORY           │
│   (Intentional Ingestion)            │    (Ambient Activity Stream)         │
│                                      │                                      │
│  - Syllabi & Assignment PDFs         │  - Windows Application Focus         │
│  - Whiteboard Photos & Screenshots   │  - Browser Tab Visits & Page Titles  │
│  - Lecture Notes & Code Snippets     │  - YouTube / Video Watch Encounters  │
│  - Uploaded Plaintext & Markdown     │  - Local Document Open Events        │
├──────────────────────────────────────┴──────────────────────────────────────┤
│                           UNIFIED RETRIEVAL LAYER                           │
│  - PostgreSQL Full-Text Search (tsvector) + pgvector Semantic Search        │
│  - Multi-Dimensional Resolution: Content + Context + Source + Time          │
├─────────────────────────────────────────────────────────────────────────────┤
│                          GOOGLE GEMINI AI REASONING                         │
│  - Grounded Synthesis from verified sources and activity logs               │
│  - Verifiable Evidence: Exact PDF Page, Browser URL, or Window Snapshot     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎬 Example Multi-Dimensional Inquiries

* **"Where did I see that React animation library yesterday?"**
  - *Recall Evidence:* Identifies Chrome browser event at 4:15 PM visiting `framer.com/motion` ("Framer Motion Quick Start").
* **"When is my DBMS assignment due?"**
  - *Recall Evidence:* Retrieves Section 4.2 in `DBMS_Course_Syllabus.pdf` (Page 2), citing the exact due date and late submission penalty.
* **"Where was that scholarship notice I saw last week?"**
  - *Recall Evidence:* Cross-references screenshot OCR with application focus history.

---

## 🛠️ Technology Stack Overview

* **Web Application:** React 19, Vite, TypeScript, Tailwind CSS, Lucide React, Radix UI
* **Backend & Storage:** Supabase (Auth, PostgreSQL, Row Level Security, Storage bucket `user_files`)
* **Search Engine:** PostgreSQL Full-Text Search (`tsvector` / GIN Index) + Hybrid Retrieval
* **Contextual Agent:** **TRACE** (`Trace.exe` — Local-first Windows collector with SQLite store)
* **AI Provider:** Google Gemini (Server-side Edge Functions with configurable `GEMINI_MODEL`)
* **Security:** Strict RLS user isolation (`auth.uid() = user_id`); zero keystroke logging, private storage signed URLs only.

---

## 📁 Repository Structure & Documentation Index

```
buildx/
├── README.md                  # Project overview, architecture, and documentation index
├── .env.example               # Environment variables template
├── package.json               # Dependencies and build scripts
├── src/
│   ├── lib/
│   │   ├── supabase.ts        # Typed Supabase client (anon key only)
│   │   └── status.ts          # Backend health check
│   ├── services/              # Clean modular service layer
│   │   ├── authService.ts
│   │   ├── sourcesService.ts
│   │   ├── documentsService.ts
│   │   ├── chunkingService.ts
│   │   ├── extractionService.ts
│   │   ├── processingPipeline.ts
│   │   ├── searchService.ts
│   │   └── activityService.ts # Contextual memory service
│   ├── types/                 # Database, Activity, and Memory entity types
│   │   ├── database.ts
│   │   ├── activity.ts
│   │   ├── memory.ts
│   │   └── index.ts
│   ├── components/            # React UI components (Auth, Upload, List, Search, Inspector)
│   ├── App.tsx                # Main React application
│   └── main.tsx               # DOM mount point
├── supabase/
│   └── migrations/
│       ├── 20261001000000_recall_initial_schema.sql
│       ├── 20261002000000_search_chunks_fts.sql
│       └── 20261003000000_contextual_activity_events.sql # Activity events schema
└── docs/
    ├── PRODUCT_VISION.md      # Dual-Memory vision and guiding principles
    ├── MEMORY_ARCHITECTURE.md # Explicit vs. Contextual Memory architecture
    ├── TRACE_SPEC.md          # Windows desktop agent specification & privacy controls
    ├── PRD.md                 # Product requirements and multi-dimensional queries
    ├── USER_FLOWS.md          # Unified memory interaction flows
    ├── AI_SPEC.md             # Gemini multi-dimensional reasoning & grounding
    ├── TECH_SPEC.md           # System architecture, DB schemas, and security
    ├── SUPABASE_SCHEMA.md     # Full SQL definitions, RLS, and storage rules
    ├── UI_SPEC.md             # Design tokens and memory search interface
    ├── ROADMAP.md             # Phased roadmap from MVP to Production
    └── DEMO_SCRIPT.md         # Live hackathon presentation script
```

---

## 🚦 Current Implementation Status

* **Completed:**
  - **Phase 1:** Supabase Foundation & Database Schemas ✅
  - **Phase 2:** Multi-Modal Ingestion & Private Storage ✅
  - **Phase 3:** Page-by-Page Extraction, OCR, & Chunking Engine ✅
  - **Phase 4:** PostgreSQL Full-Text Search & Context Retrieval ✅
  - **Phase 4.5:** Dual-Memory Architecture Evolution (Trace Specification & `activity_events` Schema) ✅
* **Next Steps:**
  - **Phase 5:** Gemini Grounded Answers via Edge Functions
  - **Phase 6:** Trace Windows Desktop Agent (`Trace.exe`)
