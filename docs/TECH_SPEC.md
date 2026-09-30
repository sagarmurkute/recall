# Recall — Technical Architecture Specification

---

## 1. System Overview & Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Next.js / React)                       │
│  - Omnibar Search & Command (⌘K)       - Multi-Modal Drag-and-Drop      │
│  - Grounded Answer & Quotes Viewer     - Split-Screen Source Inspector  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ JSON API / Streaming
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     APPLICATION BACKEND (FastAPI / Node)                │
│  - Ingestion Orchestrator              - Multi-modal Parser & Chunking  │
│  - Hybrid Search Engine (BM25 + Vec)   - Gemini Grounding Gateway       │
└──────────────┬──────────────────────────────────────────┬───────────────┘
               │                                          │
               ▼                                          ▼
┌──────────────────────────────┐          ┌───────────────────────────────┐
│     STORAGE & INDEX LAYER    │          │        GOOGLE GEMINI API      │
│ - SQLite / LibSQL (Metadata) │          │ - Gemini 2.5 Flash / Vision   │
│ - sqlite-vec / Chroma (Vecs) │          │   (OCR, Entity Extraction,    │
│ - SQLite FTS5 (Lexical BM25) │          │    Grounded Synthesis)        │
│ - Local Blob Store (Uploads) │          │ - text-embedding-004          │
└──────────────────────────────┘          └───────────────────────────────┘
```

---

## 2. Recommended Lightweight Hackathon Stack

For a rapid, robust hackathon build that is fast to run locally and easy to demo:

* **Frontend:** Next.js (App Router, React 19 / TypeScript) with Tailwind CSS, Lucide React icons, and Radix UI primitives.
* **Backend:** Next.js Route Handlers / API Routes or lightweight Python FastAPI backend for PDF/image processing.
* **AI Provider:** Google Gemini SDK (`@google/genai` or Python `google-genai` / `google-generativeai`).
* **Database & Vector Search:** 
  - **SQLite / LibSQL** for relational metadata and Full-Text Search (FTS5).
  - **In-memory vector store / sqlite-vec / ChromaDB** for vector embeddings (768 dimensions with `text-embedding-004`).
* **File Processing:** `pdfjs-dist` / `pdf-parse` / `pdfplumber` for PDF text extraction, native canvas/sharp for image preview generation.

---

## 3. Database Schema Design

### Table: `memories`
Stores ingested documents, notes, and screenshot artifacts.
```sql
CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'pdf', 'image', 'note', 'url'
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    summary TEXT,
    course_code TEXT,
    extracted_entities JSON, -- Deadlines, dates, names, formulas
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `memory_chunks`
Stores chunked content for vector and lexical retrieval.
```sql
CREATE TABLE memory_chunks (
    id TEXT PRIMARY KEY,
    memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER, -- null for single images/notes
    raw_content TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    embedding_id TEXT, -- Reference to vector table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `chunks_fts` (Full-Text Search Index)
```sql
CREATE VIRTUAL TABLE chunks_fts USING fts5(
    chunk_id UNINDEXED,
    raw_content,
    title
);
```

---

## 4. File Processing & Ingestion Pipeline

1. **Upload Handler:** Accepts multipart file payload, computes SHA-256 hash for deduplication, writes to `./storage/uploads/`.
2. **Text / Vision Processing:**
   - **PDF:** Extracts text page-by-page. For pages with low text density (<50 words), renders page as PNG and runs Gemini Vision OCR.
   - **Images (PNG/JPG):** Runs Gemini Vision with structured entity extraction prompt.
   - **Plain Text / Notes:** Direct UTF-8 ingestion.
3. **Semantic Chunking:**
   - Window size: 400 tokens (~1500 chars).
   - Overlap: 50 tokens (~200 chars).
   - Preserves page numbers and header breadcrumbs.
4. **Embedding Generation:**
   - Generates 768-dim embeddings via `text-embedding-004` in batch.
   - Writes chunks to SQLite and vector store simultaneously.

---

## 5. Search & Retrieval Pipeline

1. **Query Pre-processing:** Query sanitized, intent evaluated.
2. **Dual-Index Search:**
   - **Vector Query:** Cosine distance query against chunk embeddings (`top_k = 8`).
   - **FTS5 Query:** BM25 match query against `chunks_fts` (`top_k = 8`).
3. **Reciprocal Rank Fusion (RRF):**
   $$RRF\_Score(d) = \sum_{m \in \{vec, bm25\}} \frac{1}{60 + rank_m(d)}$$
4. **Context Selection:** Top 4–5 highest-scoring chunks assembled into structured XML prompt for Gemini.

---

## 6. API Specifications

### `POST /api/memories/upload`
Uploads and indexes a new document or image.
* **Request:** `multipart/form-data` with `file`, optional `course_code`
* **Response:**
  ```json
  {
    "memory_id": "mem_9a8f2",
    "title": "CS210 Fall 2026 Syllabus",
    "file_type": "pdf",
    "total_pages": 6,
    "chunks_indexed": 14,
    "extracted_deadlines": [
      { "item": "Project 1", "date": "2026-10-24" }
    ]
  }
  ```

### `POST /api/search`
Performs hybrid search and answers query via Gemini.
* **Request:**
  ```json
  {
    "query": "What is the policy on late lab submissions?",
    "course_filter": "CS210"
  }
  ```
* **Response:**
  ```json
  {
    "query": "What is the policy on late lab submissions?",
    "answer": {
      "direct_quotes": [
        {
          "quote": "Labs submitted up to 24 hours late receive a 15% penalty. Submissions beyond 48 hours receive zero credit.",
          "source_id": "mem_9a8f2",
          "filename": "CS210_Syllabus.pdf",
          "page": 3
        }
      ],
      "synthesis": "You lose 15% if you submit within the first 24 hours of the deadline. After 48 hours, no submissions are accepted.",
      "relevance_explanation": "Extracted directly from Section 4.2 (Grading Policies) of your syllabus."
    },
    "matched_chunks": [
      {
        "chunk_id": "chk_102",
        "memory_id": "mem_9a8f2",
        "filename": "CS210_Syllabus.pdf",
        "page_number": 3,
        "similarity_score": 0.89,
        "snippet": "...Section 4.2: Late Policy. Labs submitted up to 24 hours..."
      }
    ]
  }
  ```

### `GET /api/memories`
Lists all memories with search/filter parameters.

### `GET /api/memories/:id`
Returns full memory details, extracted entities, and chunk list.

---

## 7. Environment Variables Configuration

```env
# Google Gemini API
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-2.5-flash"
GEMINI_EMBEDDING_MODEL="text-embedding-004"

# Application Settings
PORT=3000
NODE_ENV="development"
STORAGE_DIR="./storage/uploads"
DATABASE_PATH="./storage/recall.db"

# Retrieval Hyperparameters
TOP_K_CHUNKS=5
VECTOR_WEIGHT=0.6
LEXICAL_WEIGHT=0.4
SIMILARITY_THRESHOLD=0.55
```

---

## 8. Security, Error Handling & Privacy
* **Local Storage:** Raw files and SQLite databases live within the project directory.
* **File Validation:** MIME-type validation and 25MB file-size limits protect against buffer overflow or malicious scripts.
* **Graceful Degradation:** When Gemini API quotas are exhausted, the app falls back to pure BM25 search with raw chunk snippets.
