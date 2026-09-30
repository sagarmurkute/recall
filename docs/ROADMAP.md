# Recall — Product Development Roadmap

---

## 1. Phased Development Roadmap Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     PHASE 0     │ ──►  │     PHASE 1     │ ──►  │     PHASE 2     │ ──►  │     PHASE 3     │
│ Documentation & │      │    Supabase     │      │   Upload &      │      │ Extraction &    │
│  Architecture   │      │   Foundation    │      │    Storage      │      │    Indexing     │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     PHASE 4     │ ──►  │     PHASE 5     │ ──►  │     PHASE 6     │ ──►  │  PHASES 7 & 8   │
│     Search &    │      │ Gemini Grounded │      │   Polished UI   │      │ Demo / PPT &    │
│    Retrieval    │      │     Answers     │      │   & Inspector   │      │ Post-Hackathon  │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## 2. Phase-by-Phase Breakdown

### PHASE 0: Documentation & Architecture *(Current Status)*
* [x] Define product philosophy, guiding principles, and boundaries ([`PRODUCT_VISION.md`](file:///c:/Users/Sagar/Desktop/buildx/docs/PRODUCT_VISION.md)).
* [x] Lock Hackathon MVP scope, user stories, and non-goals ([`PRD.md`](file:///c:/Users/Sagar/Desktop/buildx/docs/PRD.md)).
* [x] Define user flows and interaction states ([`USER_FLOWS.md`](file:///c:/Users/Sagar/Desktop/buildx/docs/USER_FLOWS.md)).
* [x] Specify server-side Gemini AI & prompt architecture ([`AI_SPEC.md`](file:///c:/Users/Sagar/Desktop/buildx/docs/AI_SPEC.md)).
* [x] Specify React + Vite + Tailwind + Supabase architecture ([`TECH_SPEC.md`](file:///c:/Users/Sagar/Desktop/buildx/docs/TECH_SPEC.md)).
* [x] Specify UI components, typography, and light-first palette ([`UI_SPEC.md`](file:///c:/Users/Sagar/Desktop/buildx/docs/UI_SPEC.md)).
* [x] Specify database schema, RLS, and storage rules ([`SUPABASE_SCHEMA.md`](file:///c:/Users/Sagar/Desktop/buildx/docs/SUPABASE_SCHEMA.md)).
* [x] Create 2-minute & 3-minute live pitch script ([`DEMO_SCRIPT.md`](file:///c:/Users/Sagar/Desktop/buildx/docs/DEMO_SCRIPT.md)).

---

### PHASE 1: Supabase Foundation
* [ ] Initialize Supabase project instance (local or hosted).
* [ ] Execute initial database migration `001_initial_schema.sql` (enabling `pgvector` and `uuid-ossp`).
* [ ] Configure Row Level Security (RLS) policies on all tables.
* [ ] Configure private Supabase Storage bucket `user_files` with MIME-type and size validation (25MB max).
* [ ] Setup Supabase Auth configuration (Email/Password or guest demo login).

---

### PHASE 2: Core Upload & Storage
* [ ] Setup React + Vite + TypeScript frontend boilerplate with Tailwind CSS.
* [ ] Configure Supabase client connection (`@supabase/supabase-js`) in frontend with env validation.
* [ ] Build multi-modal Drag-and-Drop Ingestion Zone supporting PDF, PNG, JPG, and TXT files.
* [ ] Upload raw binaries to Supabase Storage under `{user_id}/{source_id}/{filename}` path.
* [ ] Populate `sources` and `files` records in PostgreSQL.

---

### PHASE 3: Content Extraction & Indexing
* [ ] Build `ingest-file` Supabase Edge Function (or backend extraction handler).
* [ ] Integrate Google Gemini Vision API for screenshot OCR, whiteboard parsing, and diagram understanding.
* [ ] Implement semantic chunking (400 tokens with 50-token overlap).
* [ ] Extract structured entities (deadlines, dates, formulas) into JSONB.
* [ ] Generate 768-dimensional embeddings using `GEMINI_EMBEDDING_MODEL` (e.g., `text-embedding-004`).
* [ ] Insert parsed chunks into `extracted_content` and embeddings into `embeddings` table.

---

### PHASE 4: Search & Retrieval
* [ ] Deploy `match_memories` PostgreSQL RPC function for hybrid retrieval.
* [ ] Implement vector cosine distance querying via `pgvector` (`HNSW` index).
* [ ] Implement Full-Text Search ranking via PostgreSQL `tsvector` and `websearch_to_tsquery`.
* [ ] Build query preprocessing and top-K candidate chunk selection (`top_k = 5`).

---

### PHASE 5: Gemini Grounded Answers
* [ ] Build `query-memory` Supabase Edge Function with secure server-side Gemini API key management.
* [ ] Implement strict grounded system prompt enforcing source-first truth.
* [ ] Generate structured response separating **Verified Direct Quotes** from **AI Synthesis**.
* [ ] Implement citation token validation `[SRC-#]` linking to `extracted_content.id`.
* [ ] Implement fallback handling for queries with insufficient source data (*"Not found in your saved sources"*).

---

### PHASE 6: Polished UI & Inspector
* [ ] Build the 7 core Hackathon UI screens:
  1. Landing / Sign-In
  2. Dashboard (Recent memories feed)
  3. Upload Modal / Drag-and-Drop Zone
  4. Search Omnibar (`⌘K`)
  5. Search Results View
  6. Split-Screen Source Inspector (Left: Extracted facts, Right: Signed-URL PDF/Image Viewer)
  7. Basic Settings / Profile
* [ ] Implement micro-interactions, responsive states, skeleton shimmers, and error states.
* [ ] Ensure zero generic chatbot windows and zero bento-grid layouts.

---

### PHASE 7: Hackathon Demo & Presentation
* [ ] Pre-load student demo dataset:
  - `DBMS_Course_Syllabus.pdf`
  - `BuildX_Hackathon_Schedule.png`
  - `College_Timetable_Fall.pdf`
  - `Merit_Scholarship_Notice.png`
  - `Midterm_Exam_Schedule.txt`
* [ ] Rehearse 2-minute and 3-minute demo pitches following [`DEMO_SCRIPT.md`](file:///c:/Users/Sagar/Desktop/buildx/docs/DEMO_SCRIPT.md).
* [ ] Prepare offline fail-safe assets and recorded video walkthrough.

---

### PHASE 8: Post-Hackathon Roadmap & Integrations
*(Intentionally deferred beyond the Hackathon MVP)*
* **Ambient Cloud Importers:** Gmail OAuth sync, Google Drive automated folder watcher, Canvas LMS connector.
* **Mobile & Chat Ingestion:** WhatsApp and Telegram bot forwarding for whiteboard photos and voice notes.
* **Browser Extension:** Chrome Web Clipper for 1-click capture of syllabus pages and online articles.
* **Advanced Study Agents:** Proactive exam cram sheet generator, flashcards, and cross-document concept graph.
* **Production Scaling:** Asynchronous background job queue (BullMQ/Temporal), Redis caching, and enterprise multi-region storage.
