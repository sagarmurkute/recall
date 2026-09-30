# Recall — Technical Architecture Specification

---

## 1. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RECALL WEB CLIENT (React + Vite)                      │
│  - Natural Query Omnibar ("What are you trying to remember?")               │
│  - Dual-Memory View (Explicit Ingestion Vault + Contextual Activity)        │
│  - Grounded Answer & Source Viewer with Signed Storage URLs                 │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │ HTTPS / Supabase JWT
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND & EDGE FUNCTIONS                         │
│                                                                             │
│  ┌─────────────────────────────────┐   ┌──────────────────────────────────┐ │
│  │ Explicit Memory Storage         │   │ Contextual Memory Log            │ │
│  │ - Storage bucket: user_files    │   │ - activity_events table          │ │
│  │ - sources, documents, chunks    │   │ - App focus, browser URLs, files │ │
│  └────────────────┬────────────────┘   └────────────────┬─────────────────┘ │
│                   │                                     │                   │
│                   └──────────────────┬──────────────────┘                   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     POSTGRESQL HYBRID DATABASE                        │  │
│  │  - PostgreSQL Full-Text Search (tsvector on chunks & activity events) │  │
│  │  - pgvector 768-dim embeddings (Phase 5)                              │  │
│  │  - Row Level Security (RLS) on all user tables (auth.uid() = user_id) │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────▲──────────────────────────────────▲───────────────────┘
                       │ Cloud Sync Bridge                │ Server Secrets
                       │ (Optional / Filtered)            │ (Protected)
┌──────────────────────┴──────────────┐          ┌────────┴───────────────────┐
│     TRACE DESKTOP AGENT (Windows)   │          │     GOOGLE GEMINI API      │
│  - Trace.exe (Local-first collector)│          │  - GEMINI_MODEL            │
│  - Local SQLite (%APPDATA%/Trace)   │          │  - GEMINI_EMBEDDING_MODEL  │
│  - Privacy filter & pause toggle    │          │  - Grounded reasoning      │
└─────────────────────────────────────┘          └────────────────────────────┘
```

---

## 2. Dual-Memory Data Architecture

### 2.1 Explicit Memory Tier (Intentional Files)
* **`sources`:** Tracks original files, screenshots, and uploads.
* **`documents`:** High-level parsed entity representing a source.
* **`document_chunks`:** Page-by-page and paragraph-bounded text segments with `fts_tokens` tsvectors.
* **`user_files` Storage Bucket:** Private encrypted binaries accessed via 60-min signed URLs.

### 2.2 Contextual Memory Tier (Trace Desktop Stream)
* **`activity_events` Table:**
  - `event_type`: `'app_focus'`, `'browser_visit'`, `'file_open'`, `'custom'`.
  - `application`: Process name (e.g., `'Code.exe'`, `'chrome.exe'`).
  - `window_title`: Active title text.
  - `url`: Visited web domain and URL (sanitized).
  - `timestamp`: Event start timestamp.
  - `duration_seconds`: Active time spent on window/tab.
  - `fts_tokens`: GIN indexed tsvector combining window title, application, and URL.

---

## 3. Row Level Security & Isolation
* Every table (`profiles`, `collections`, `sources`, `documents`, `document_chunks`, `activity_events`, `search_history`) enforces strict RLS policies ensuring users can only read, write, update, and delete their own records.
* Service-role keys and Gemini AI API keys remain exclusively server-side.
