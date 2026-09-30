# Recall — Dual-Memory Architecture Specification

> **"You already encountered the information. Recall helps you find it again."**

---

## 1. Executive Concept: The Dual-Memory Model

Recall is a **Personal Memory System** designed to answer the universal human problem:
> *"I remember seeing this somewhere. Where was it?"*

Knowledge in human memory is stored with rich contextual cues—**time**, **application**, **visuals**, **surrounding activity**, and **exact content**. Recall mirrors this cognitive model through a unified dual-memory system:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          UNIFIED MEMORY ENGINE                              │
├──────────────────────────────────────┬──────────────────────────────────────┤
│       1. EXPLICIT MEMORY             │       2. CONTEXTUAL MEMORY           │
│   (Intentional Ingestion)            │    (Ambient Activity Stream)         │
│                                      │                                      │
│  - Syllabi & Assignment PDFs         │  - Windows Application Switches      │
│  - Whiteboard Photos & Screenshots   │  - Browser Tab Visits & Page Titles  │
│  - Lecture Notes & Code Snippets     │  - YouTube / Video Watch History     │
│  - Uploaded Plaintext & Markdown     │  - Local Document Open Events        │
│                                      │  - Social Media & Web Resources      │
├──────────────────────────────────────┴──────────────────────────────────────┤
│                           UNIFIED RETRIEVAL LAYER                           │
│  - Full-Text Search (tsvector)       - Vector Semantic Search (pgvector)    │
│  - Temporal Filtering (Time/Date)    - Multi-Vector Metadata Filtering      │
├─────────────────────────────────────────────────────────────────────────────┤
│                          GOOGLE GEMINI AI REASONING                         │
│  - Synthesizes Answer from Content + Context + Time                         │
│  - Grounded Evidence: Exact Document Page / Application Window / Web URL    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Memory Types Defined

### Type 1: Explicit Memory (Intentional Ingestion)
* **Definition:** Digital artifacts the user consciously uploads, drags, or saves to Recall.
* **Ingestion Layer:** Web application drag-and-drop zone, file pickers, cloud drives.
* **Data Objects:** Parsed documents, page-by-page text chunks, OCR-transcribed screenshots.
* **Storage Entities:** `sources`, `documents`, `document_chunks`.

### Type 2: Contextual Memory (Ambient Activity Stream via TRACE)
* **Definition:** Ephemeral activity breadcrumbs captured locally from the user's workstation.
* **Ingestion Layer:** **TRACE** (`Trace.exe`) — a lightweight, privacy-first Windows desktop agent.
* **Data Objects:** Active window titles, browser URLs, app names, timestamps, durations.
* **Storage Entities:** `activity_events`.

---

## 3. The 4-Dimensional Unified Query Paradigm

When a user queries Recall, the query is resolved across 4 orthogonal dimensions:

```
        WHAT? (Content)             WHERE? (Source / Application)
        "React animation library"   "Chrome / YouTube / VS Code"
                   ▲                             ▲
                   │                             │
                   └──────────────┬──────────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
                   ▼                             ▼
        WHEN? (Time)                WHO / WHY? (Context)
        "Yesterday around 4 PM"     "Working on frontend project"
```

### Example Multi-Modal Query Scenarios:
1. **Context + Content:** *"I saw a website yesterday about a React animation library. What was it?"*
   - *Retrieval:* Looks for browser events between 24–48 hours ago matching "React animation", retrieves page title, URL, and window duration.
   - *Gemini Answer:* *"You visited `framer.com/motion` in Google Chrome yesterday at 4:15 PM while viewing 'Framer Motion Quick Start'."*
2. **Document + Deadline:** *"When is my DBMS assignment due?"*
   - *Retrieval:* Matches explicit chunk in `DBMS_Course_Syllabus.pdf` (Page 2).
   - *Gemini Answer:* *"DBMS Assignment 2 is due Thursday, Oct 24 at 11:59 PM with a 10% daily late penalty."*
3. **App Context + Screenshot:** *"Where was that scholarship link I saw on Discord?"*
   - *Retrieval:* Cross-references Discord window events with OCR-scanned screenshots matching "scholarship".

---

## 4. Entity Model & Relationship Mapping

```
                               ┌──────────────────┐
                               │   auth.users     │
                               └────────┬─────────┘
                                        │ 1:1
                                        ▼
                               ┌──────────────────┐
                               │     profiles     │
                               └────────┬─────────┘
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           │ 1:N                                                     │ 1:N
           ▼                                                         ▼
  [EXPLICIT MEMORY]                                         [CONTEXTUAL MEMORY]
┌─────────────────────┐                                   ┌─────────────────────┐
│       sources       │                                   │   activity_events   │
│  (Uploaded files)   │                                   │ (Trace ambient log) │
└──────────┬──────────┘                                   └─────────────────────┘
           │ 1:N
           ▼
┌─────────────────────┐
│      documents      │
└──────────┬──────────┘
           │ 1:N
           ▼
┌─────────────────────┐
│   document_chunks   │
│ (Searchable text)   │
└─────────────────────┘
```

---

## 5. Security, Privacy & User Agency

1. **Local-First Trace Capture:** Trace records activity locally into a local SQLite store before any sync.
2. **Selective Cloud Synchronization:** The user chooses whether contextual events stay 100% on-device or sync to their private Supabase cloud vault.
3. **Row Level Security (RLS):** All `activity_events` in PostgreSQL have strict RLS policies: `auth.uid() = user_id`.
4. **No Sensitive Ingestion:** Passwords, keystrokes, incognito windows, private form inputs, and banking domains are strictly blocked at the collector level.
