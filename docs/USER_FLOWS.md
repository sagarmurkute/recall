# Recall — User Flows & Interaction Architecture

---

## 1. Unified Memory Interaction Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       1. DUAL MEMORY CAPTURE                                │
├──────────────────────────────────────┬──────────────────────────────────────┤
│       EXPLICIT INGESTION             │       CONTEXTUAL AMBIENT STREAM      │
│  - Drag & Drop PDF, TXT, PNG, JPG    │  - Trace.exe records app/tab focus   │
│  - Extracted & Chunked to Database   │  - Selective sync to activity_events  │
└──────────────────────────────────────┴──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       2. NATURAL MEMORY SEARCH                              │
│         "What was that React library I saw yesterday on Chrome?"            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       3. GROUNDED ANSWER & EVIDENCE                         │
│  - Direct Answer + Time & Application Context                               │
│  - Clickable Evidence: Exact PDF Page, Browser URL, or Window Snapshot       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Interaction Scenarios

### Flow A: Explicit Document Retrieval
1. User asks: *"When is my DBMS assignment due?"*
2. Recall queries `document_chunks`.
3. Displays verbatim quote from `DBMS_Course_Syllabus.pdf` with page jump link.

### Flow B: Contextual Encounter Retrieval
1. User asks: *"Where did I see that scholarship notice yesterday?"*
2. Recall queries `activity_events` and cross-references `document_chunks`.
3. Displays: *"You visited `university.edu/scholarships` in Chrome yesterday at 2:30 PM."* with direct URL link.
