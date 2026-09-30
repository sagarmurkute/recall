# Recall — Product Requirements Document (PRD)

---

## 1. Product Overview
**Recall** is an AI-powered personal memory system designed to help users rediscover information they have previously encountered across files, screenshots, browser pages, and applications. Built around a **Dual-Memory Architecture** (Explicit Ingestion + Trace Contextual Memory), Recall combines deterministic hybrid retrieval with **Google Gemini** reasoning to deliver verifiable answers with exact source evidence.

---

## 2. The Core Problem
Modern knowledge workers and students encounter thousands of information fragments every week across diverse mediums (PDFs, browser tabs, screenshots, Discord messages, YouTube videos, desktop apps). Users routinely remember *that* they saw or read something, but cannot answer: *"Where did I see that?"*

---

## 3. Dual-Memory System Requirements

### 3.1 Explicit Memory (Document & Media Vault)
* **Ingestion:** Direct upload of PDFs, TXT, PNG, JPG/JPEG files.
* **Extraction:** Page-by-page text extraction for PDFs and client-side OCR for screenshots.
* **Storage:** Private Supabase Storage bucket (`user_files`) with metadata in PostgreSQL.
* **Chunking:** Paragraph/sentence-aware semantic chunking with page number preservation.

### 3.2 Contextual Memory (Trace Windows Agent)
* **Agent:** Standalone, privacy-first desktop executable (**`Trace.exe`**).
* **Collectors:**
  - Application focus events (process name, window title, duration).
  - Browser navigation events (browser name, page title, URL, duration).
  - File access events (opened filename, associated application).
* **Privacy Controls:** Local-first SQLite store, Pause/Resume toggle, App/Domain exclusions, history purge, and selective cloud sync.
* **Database Entity:** `activity_events` in Supabase with Full-Text Search tokens and RLS.

---

## 4. Multi-Dimensional Search & Grounding

Recall processes queries combining:
* **Content:** *"React animation library"*
* **Context / Source:** *"I saw on Chrome / YouTube / in a PDF"*
* **Time:** *"Yesterday afternoon"*

### Answer Delivery:
* **Direct Evidence:** Verbatim document excerpt, browser URL, or application window title.
* **Gemini Grounded Synthesis:** Plain-English summary explaining the context and exact location.

---

## 5. MVP vs. Roadmap Matrix

| Feature | Hackathon MVP | Prototype v1 | Production v2 |
| :--- | :---: | :---: | :---: |
| React + Vite + Tailwind Frontend | ✅ Yes | ✅ Yes | ✅ Yes |
| Supabase Auth, PostgreSQL, Private Storage | ✅ Yes | ✅ Yes | ✅ Yes |
| Multi-Modal File Ingestion (PDF, TXT, PNG, JPG) | ✅ Yes | ✅ Yes | ✅ Yes |
| Page-by-Page Extraction & Chunking | ✅ Yes | ✅ Yes | ✅ Yes |
| PostgreSQL Full-Text Search Retrieval | ✅ Yes | ✅ Yes | ✅ Yes |
| Contextual Activity Schema (`activity_events`) | ✅ Yes | ✅ Yes | ✅ Yes |
| Trace.exe Windows Collector Core | ❌ No | ✅ Yes | ✅ Yes |
| Gemini Grounded Synthesis (Server-side) | ❌ (Phase 5) | ✅ Yes | ✅ Yes |
| pgvector Semantic Embeddings | ❌ (Phase 5) | ✅ Yes | ✅ Yes |
| Browser Extension Companion | ❌ No | ✅ Yes | ✅ Yes |
