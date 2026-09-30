# Recall — Product Development Roadmap

---

## 1. Phased Development Roadmap

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     PHASE 1     │ ──►  │     PHASE 2     │ ──►  │     PHASE 3     │ ──►  │     PHASE 4     │
│    Supabase     │      │   Upload &      │      │ Extraction &    │      │ Full-Text Search│
│   Foundation    │      │    Storage      │      │    Chunking     │      │   & Retrieval   │
│     [DONE]      │      │     [DONE]      │      │     [DONE]      │      │     [DONE]      │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     PHASE 5     │ ──►  │     PHASE 6     │ ──►  │     PHASE 7     │ ──►  │     PHASE 8     │
│ Gemini Grounded │      │ Trace Desktop   │      │ Unified Memory  │      │ Polished UI &   │
│     Answers     │      │  Agent (Win)    │      │ Context Search  │      │ Live Hackathon  │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## 2. Phase-by-Phase Breakdown

* **PHASE 1: Supabase Foundation [DONE]** — PostgreSQL schema, Auth, RLS, Storage bucket.
* **PHASE 2: Ingestion & Storage [DONE]** — Multi-modal file upload (PDF, TXT, PNG, JPG) to private storage.
* **PHASE 3: Extraction & Chunking [DONE]** — Page-by-page PDF extraction, OCR for screenshots, sliding-window chunking.
* **PHASE 4: Search & Retrieval [DONE]** — PostgreSQL Full-Text Search RPC (`search_document_chunks`) and context retrieval.
* **PHASE 4.5: Dual-Memory Architecture Evolution [CURRENT]** — Contextual memory schema (`activity_events`), Trace specification, and multi-dimensional query model.
* **PHASE 5: Gemini Grounded Answers** — Server-side Gemini Edge Function synthesis with verifiable citations and direct quotes.
* **PHASE 6: Trace Windows Desktop Agent** — Local-first `Trace.exe` application focus and browser URL collector.
* **PHASE 7: Unified Memory Retrieval** — Multi-dimensional search merging explicit document chunks with contextual activity streams.
* **PHASE 8: Polished UI & Live Demo** — Final hackathon UI polish and presentation.
