# Recall — Product Development Roadmap

---

## 1. Roadmap Overview & Milestones

```
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│    Hackathon MVP    │ ──►  │    Prototype v1     │ ──►  │    Prototype v2     │ ──►  │   Production / V3   │
│  (React + Supabase) │      │  (Cloud Connectors) │      │   (Agents & Graph)  │      │  (Enterprise Scale) │
│    [0 - 24 Hours]   │      │    [Weeks 1 - 4]    │      │   [Months 2 - 3]    │      │    [Months 4+]      │
└─────────────────────┘      └─────────────────────┘      └─────────────────────┘      └─────────────────────┘
```

---

## 2. Milestone Breakdown

### Phase 1: Hackathon MVP (Target: 24–48 Hours)
**Objective:** Deliver a live, end-to-end working application with real Supabase infrastructure, vector retrieval, and Gemini-grounded synthesis.

* **Frontend:** React + Vite + TypeScript + Tailwind CSS with Omnibar (`⌘K`), Grounded Answer Box, and Split-Screen Source Inspector.
* **Backend & DB:** Supabase PostgreSQL with `pgvector`, Full-Text Search (`tsvector`), Supabase Auth, and Supabase Storage for multi-modal uploads.
* **AI Layer:** Supabase Edge Functions connecting securely to Google Gemini 2.5/1.5 Flash (Vision OCR & Synthesis) and `text-embedding-004` (embeddings) with zero client-side key exposure.
* **Security:** Row Level Security (RLS) enabled on all tables; private storage buckets with signed URLs.
* **Deliverable:** Live demo ready to ingest PDFs, screenshots, and notes, answering student queries with verifiable citations in under 3 seconds.

---

### Phase 2: Prototype v1 (Ambient Connectors & Extensions: 1 Month)
**Objective:** Broaden data ingestion vectors and automate student capture workflows.

* **Features:**
  - **Gmail & Google Drive Importers:** Server-side OAuth sync bringing course announcements, syllabus updates, and shared Drive PDFs into `sources`.
  - **Chrome Web Clipper Extension:** 1-click capture of Canvas/Blackboard pages, online problem sets, and research articles.
  - **WhatsApp & Telegram Forwarding Bot:** Students forward whiteboard photos and voice notes directly into Supabase Storage.
  - **Auto-Tagging Course Classifier:** Automatically categorizes new uploads into course collections (`#CS210`, `#CHEM101`).

---

### Phase 3: Prototype v2 (Deep Intelligence & Proactivity: 2–3 Months)
**Objective:** Evolve Recall into an active, proactive study assistant.

* **Features:**
  - **Cross-Document Knowledge Graph:** Maps semantic links across lecture notes, homework rubrics, and textbook excerpts.
  - **Automated Deadline & Exam Calendar:** Aggregates extracted deadlines into an interactive student calendar view.
  - **Exam Cram Generator:** Generates custom practice questions grounded strictly in the student's uploaded materials.
  - **Background Batch Processing:** Asynchronous queue for deep OCR and document indexing.

---

### Phase 4: Production Architecture & Scaling (4+ Months)
**Objective:** Enterprise-grade reliability, multi-device synchronization, and offline capabilities.

* **Features:**
  - **Advanced AI Agents:** Autonomous agents that cross-compare assignments against lecture content to identify knowledge gaps.
  - **Fine-Grained Privacy & Encryption:** Zero-knowledge metadata indexing and end-to-end encryption for stored documents.
  - **Cross-Platform Native Apps:** Native desktop (Electron / Tauri) and mobile (React Native) companion apps with global keyboard shortcuts.
