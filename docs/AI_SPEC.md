# Recall — AI System & Prompt Architecture Specification

---

## 1. Google Gemini Architectural Role & Boundaries

In Recall, **Google Gemini operates as the reasoning and extraction engine**, while PostgreSQL (with `pgvector` and Full-Text Search) acts as the retrieval and indexing layer.

### Key Architectural Boundaries:
* **Zero Client-Side Exposure:** Gemini API keys are **never** bundled with client-side React/Vite code. All AI calls originate strictly from secure **Supabase Edge Functions**.
* **Separation of Retrieval and Synthesis:** Gemini does not act as a blind database. PostgreSQL retrieves grounded candidate chunks via hybrid vector/lexical search, and Gemini synthesizes verifiable answers strictly constrained to those retrieved chunks.
* **Multi-Modal Understanding:** Gemini 2.5 / 1.5 Flash is used for OCR of screenshots, whiteboard photos, and complex PDF page layouts.
* **Embedding Model:** Google `text-embedding-004` generates 768-dimensional dense vectors stored directly in PostgreSQL via `pgvector`.

---

## 2. End-to-End AI Data Flow

```
[User Uploads File to Supabase Storage]
                 │
                 ▼
[Supabase Edge Function: /ingest-file]
                 │
                 ├──────────────────────────────┐
                 ▼                              ▼
  [Gemini Flash Vision OCR]            [Gemini Structured Extractor]
  (Extracts raw text, formulas,        (Extracts deadlines, dates,
   diagram labels from images/PDFs)     professors, course codes)
                 │                              │
                 └──────────────┬───────────────┘
                                ▼
                   [Semantic Text Chunking]
                    (400 tokens + 50 overlap)
                                │
                                ▼
                 [text-embedding-004 Embedding]
                                │
                                ▼
         [PostgreSQL DB: extracted_content & embeddings]
                                │
                                │
[User Search Query via Omnibar] ┤
                                ▼
[Supabase Edge Function: /query-memory]
                                │
                                ▼
           [PostgreSQL match_memories Hybrid RPC]
            (pgvector cosine + FTS5 tsvector rank)
                                │
                                ▼ Top 5 Grounded Chunks
           [Gemini Flash Grounded Synthesis Prompt]
                                │
                                ▼
      [Grounded Answer + Verbatim Quotes + Citation Links]
```

---

## 3. Ingestion & Multi-Modal Understanding

### Multi-Modal Extraction Protocol
1. **PDFs:** Edge function downloads PDF binary from Supabase Storage. Text layers are extracted directly; scanned pages or diagram-rich pages are rendered to images and processed via Gemini Vision.
2. **Images / Screenshots:** Direct payload pass to `gemini-2.5-flash` with the Multi-Modal Extraction Prompt.
3. **Structured Entity Extraction Schema:**
During ingestion, Gemini extracts structured metadata stored in `extracted_content.extracted_entities`:
```json
{
  "title": "CS210 Fall 2026 - Syllabus",
  "summary": "Covers course outline, 15% late penalty, and exam dates.",
  "course_code": "CS210",
  "deadlines": [
    {
      "item": "Lab 1 Submission",
      "date": "2026-10-15",
      "time": "23:59",
      "details": "Submitted via Gradescope with 15% daily late deduction"
    }
  ],
  "people": ["Prof. Miller", "TA Sarah"],
  "topics": ["Algorithms", "Graph Traversal", "Dijkstra"]
}
```

---

## 4. Grounded Prompt Architecture

### System Prompt for `/query-memory` Edge Function
```text
You are Recall, an academic retrieval and personal memory assistant.
You must answer the student's question STRICTLY and ONLY using the provided source chunks below.

CONSTRAINTS & PROTOCOLS:
1. GROUNDED TRUTH ONLY: Use ONLY the information provided inside <sources>. Do NOT guess, speculate, or draw from outside general knowledge.
2. VERBATIM QUOTES: In the "direct_quotes" array, provide exact verbatim strings directly copied from the sources, paired with their source_id and page number.
3. CONCISE SYNTHESIS: In the "synthesis" field, provide a clear, direct answer in 2-3 sentences.
4. CITATION TOKENS: When stating facts in the synthesis, reference the source using [SRC-ID].
5. NOT FOUND PROTOCOL: If the answer is NOT present in the sources, you must return:
   {
     "status": "NOT_FOUND",
     "message": "This information was not found in your saved materials.",
     "direct_quotes": [],
     "synthesis": ""
   }

<sources>
{{RETRIEVED_CHUNKS_XML}}
</sources>

QUESTION: {{USER_QUERY}}
```

---

## 5. Confidence Scoring & Hallucination Prevention

* **Threshold Filtering:** If top chunk vector similarity in `match_memories` is `< 0.55` and FTS rank is `0`, the Edge function skips the Gemini synthesis call entirely and returns an immediate `"NOT_FOUND"` response to preserve latency and prevent hallucination.
* **Citation Verification:** The Edge function validates that every `[SRC-ID]` cited by Gemini corresponds to an actual chunk in the retrieved set.
* **Side-by-Side Direct Quotes:** The UI always displays the raw text quote alongside Gemini's synthesis, giving the user immediate verification capability.

---

## 6. Privacy & Security Safeguards
* **No User Data Retention for Training:** Gemini API calls are made with standard developer enterprise flags disabling training on customer payloads.
* **Server-Side Key Isolation:** Gemini API keys are stored solely as environment secrets in Supabase Edge Functions.
* **Tenant Isolation:** Queries to PostgreSQL always include `WHERE user_id = auth.uid()` enforced by database RLS.
