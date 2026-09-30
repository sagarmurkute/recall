# Recall — Product Development Roadmap

---

## 1. Roadmap Overview & Milestones

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Hackathon MVP  │ ──►  │  Prototype v1   │ ──►  │  Prototype v2   │ ──►  │ Production / V3 │
│  (0 - 24 Hours) │      │  (Weeks 1 - 4)  │      │  (Months 2 - 3) │      │  (Months 4+)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## 2. Milestone Breakdown

### Phase 1: Hackathon MVP (Target: 24-48 Hours)
**Objective:** Deliver a working, end-to-end prototype capable of ingesting student files, executing hybrid search, and displaying Gemini-grounded answers with verbatim citations.

* **Core Scope & Deliverables:**
  - [x] Multi-format ingestion pipeline (PDF, PNG/JPG screenshots, TXT notes).
  - [x] Gemini Flash Vision integration for OCR and document understanding.
  - [x] Lightweight embedding generation with `text-embedding-004`.
  - [x] Hybrid search layer (vector cosine similarity + SQLite FTS5 lexical matching).
  - [x] Grounded Answer Box with clear visual distinction between Direct Quotes and AI Synthesis.
  - [x] Split-Screen / Modal Source Inspector with page jump navigation.
  - [x] Sample student course dataset (Syllabus, Lecture Slide Screenshot, Lab Rubric) for instant live demo.

---

### Phase 2: Prototype v1 (Post-Hackathon Polish: 1 Month)
**Objective:** Reduce ingestion friction and increase daily active utility with ambient capture tools.

* **Features:**
  - **Chrome Web Clipper Extension:** 1-click capture of Canvas/Blackboard web pages, research papers, and web articles directly into Recall.
  - **Auto-Tagging & Course Classifier:** Automatically sorts incoming documents into course folders (`#CS210`, `#CHEM101`) using zero-shot classification.
  - **Deadline Extraction Calendar View:** Aggregates all extracted deadlines from syllabi into an interactive student timeline.
  - **Streaming AI Responses:** Server-Sent Events (SSE) for instant token-by-token synthesis generation.

---

### Phase 3: Prototype v2 (Deep Intelligence & Proactivity: 2–3 Months)
**Objective:** Transform Recall from a reactive search tool into a proactive study companion.

* **Features:**
  - **Cross-Document Knowledge Graph:** Maps semantic clusters across lecture notes, homework rubrics, and textbook excerpts.
  - **Telegram & WhatsApp Forwarding Bot:** Students forward screenshot photos and voice notes directly from mobile messaging apps into Recall.
  - **Exam Cram Generator:** Generates custom practice quizzes and flashcard decks grounded exclusively in the student's own course materials.
  - **Local On-Device OCR & Caching:** Pre-computes embeddings and OCR locally to reduce API costs and enable fast offline browsing.

---

### Phase 4: Production Architecture & Scaling (4+ Months)
**Objective:** Enterprise-grade reliability, multi-device synchronization, and automated cloud storage sync.

* **Features:**
  - **Direct LMS & Cloud Sync:** Native OAuth integration with Google Drive, Notion, Microsoft OneDrive, and Canvas LMS.
  - **Multi-Tenant Distributed Vector Database:** Migration to Qdrant or Pinecone with high-throughput horizontal scaling.
  - **Fine-Grained Privacy & Encryption:** End-to-end encryption for stored documents with zero-knowledge metadata indexes.
  - **Cross-Platform Native Apps:** Native desktop (Electron / Tauri) and mobile (React Native) companion apps with global keyboard hotkeys.
