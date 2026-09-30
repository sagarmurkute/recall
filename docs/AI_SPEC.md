# Recall — AI System & Prompt Architecture Specification

---

## 1. Architectural Role of Google Gemini
In Recall, **Google Gemini operates as the reasoning, multi-modal extraction, and synthesis engine**, while PostgreSQL (with `pgvector` and Full-Text Search) handles indexing and deterministic retrieval.

### Key AI Principles:
1. **Zero Client-Side Key Exposure:** Gemini API keys are never bundled with frontend code. All AI operations are executed inside authenticated **Supabase Edge Functions**.
2. **Configurable Model Architecture:** Model names are configurable via environment variables (`GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL`). Model identifiers must be verified against current Google Gemini API availability before implementation.
3. **Strict Separation of Truth Categories:**
   - **Category A (Direct Grounded Facts):** Verbatim quotes pulled directly from uploaded sources.
   - **Category B (AI Synthesis & Summary):** Structured explanations, context clarifications, and relevance reasoning.
   - **Category C (Missing / Not Found):** Explicit statement when evidence is absent in the user's data pool.

---

## 2. Decoupled AI Pipeline Architecture

```
[User Query from Omnibar]
           │
           ▼
[Supabase Edge Function: /query-memory]
           │
           ├──────────────────────────────┐
           ▼                              ▼
 [Generate Query Embedding]      [Sanitize & Tokenize]
  (GEMINI_EMBEDDING_MODEL)       (Lexical Search Query)
           │                              │
           └──────────────┬───────────────┘
                          ▼
             [PostgreSQL: match_memories]
         (pgvector Cosine + FTS tsvector Rank)
                          │
                          ▼ Top 5 Candidate Chunks
           [Context Assembly & Grounding Guard]
                          │
        ┌─────────────────┴─────────────────┐
        ▼ (Chunks Found > 0.55)             ▼ (No Chunks Found)
[Gemini Generative Synthesis]         [Return NOT_FOUND State]
 (Strict Grounded System Prompt)       (Refuses to hallucinate)
        │
        ▼
[Structured Response: Quotes + Synthesis + Citations]
```

---

## 3. Multi-Modal Ingestion & Vision OCR

### Supported Ingestion Media (Hackathon MVP):
* **PDFs (`application/pdf`):** Extracts digital text layers and converts image-heavy/scanned pages into image frames for Gemini Vision OCR.
* **Screenshots & Photos (`image/png`, `image/jpeg`):** Processed via `gemini-2.5-flash` / `gemini-1.5-flash` Vision to transcribe text, whiteboard handwriting, and diagram labels.
* **Plain Text Notes (`text/plain`, `text/markdown`):** Direct UTF-8 ingestion.

### Structured Entity Extraction Output:
During ingestion, the Edge Function invokes Gemini with structured JSON output enforcement:
```json
{
  "title": "DBMS Assignment 2 Guidelines",
  "summary": "Covers relational algebra questions, late penalties, and due date.",
  "document_type": "syllabus_or_assignment",
  "extracted_entities": {
    "deadlines": [
      {
        "item": "DBMS Assignment 2",
        "date": "2026-10-24",
        "time": "23:59",
        "details": "Submitted via Canvas with 10% daily late deduction"
      }
    ],
    "key_topics": ["Relational Algebra", "Tuple Calculus", "SQL Joins"],
    "instructors": ["Prof. Sharma"]
  }
}
```

---

## 4. Grounded Prompt Architecture

### System Prompt for `/query-memory`
```text
You are Recall, a high-precision academic retrieval assistant.
Your task is to answer the student's question STRICTLY and ONLY using the provided source chunks below.

CORE OPERATIONAL RULES:
1. SOURCE-FIRST TRUTH: You must ONLY use facts stated in the provided <sources>. Do NOT extrapolate, assume, or draw from outside knowledge.
2. DUAL RESPONSE DISTINCTION:
   - "direct_quotes": Extract exact verbatim sentences directly from the sources with their source_id and page number.
   - "synthesis": Provide a concise 2-3 sentence direct answer summarizing the context in plain English.
   - "relevance_explanation": Explain in one sentence why this source was selected.
3. CITATIONS: Use standard citation markers [SRC-#] whenever referring to facts in the synthesis.
4. INSUFFICIENT EVIDENCE / NOT FOUND:
   If the answer is NOT explicitly contained in the sources, you MUST return:
   {
     "status": "NOT_FOUND",
     "message": "I could not find information regarding this question in your saved materials.",
     "direct_quotes": [],
     "synthesis": ""
   }
   NEVER invent or hypothesize an answer if it is absent from the sources.

<sources>
{{RETRIEVED_CHUNKS_XML}}
</sources>

STUDENT QUESTION: {{USER_QUERY}}
```

---

## 5. Confidence Scoring & Hallucination Prevention

| Level | Condition | System Action |
| :--- | :--- | :--- |
| **High Confidence** | pgvector similarity > 0.75 OR exact FTS keyword hit | Generates synthesis with verified green citation badge. |
| **Moderate Confidence** | pgvector similarity between 0.55–0.75 | Generates synthesis with source context highlight. |
| **Insufficient Evidence** | pgvector similarity < 0.55 and FTS rank = 0 | Bypasses Gemini generation entirely; returns immediate `"NOT_FOUND"` response. |

---

## 6. Privacy & Security Safeguards
* **Zero Training Retention:** Gemini API requests utilize standard developer enterprise flags to prevent training on student data.
* **Server-Side API Key Storage:** Gemini API keys are maintained solely within Supabase Edge Secrets.
* **Tenant Isolation:** Ingestion and retrieval are always scoped to the authenticated student's `auth.uid()`.
