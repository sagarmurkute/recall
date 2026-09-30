# Recall — AI System & Prompt Architecture Specification

---

## 1. Architectural Role of Google Gemini
A core architectural principle of Recall is **Separation of Retrieval and Reasoning**:
* **Retrieval Layer (Deterministic/Vector):** Uses fast vector similarity (e.g. `text-embedding-004` embeddings in SQLite-vec / Chroma) combined with lexical search (BM25 / Full-Text Search) to locate candidate chunks from the user's database.
* **Reasoning & Synthesis Layer (Google Gemini):** Gemini (e.g., `gemini-2.5-flash` or `gemini-1.5-flash`) is used for:
  1. Multi-modal ingestion & OCR (understanding text/diagrams in screenshots and PDFs).
  2. Structured entity extraction (deadlines, dates, course codes, key terms).
  3. Grounded synthesis and answer generation.
  4. Direct quotation extraction and citation validation.
  5. Explaining why a result is relevant to the user's query.

Gemini is **never** relied upon as a black-box database; it receives strictly formatted, retrieved context chunks and operates under strict grounding constraints.

---

## 2. End-to-End AI Pipeline

```
[User Upload (PDF / Image / Note)]
       │
       ▼
[Stage 1: Multi-Modal Ingestion & OCR] ──► Gemini Flash Vision
       │
       ▼
[Stage 2: Chunking & Structuring] ────────► 300-500 token chunks + Metadata
       │
       ├────────────────────────┬────────────────────────┐
       ▼                        ▼                        ▼
[Text Embeddings]       [Entity Extraction]      [Lexical Index (FTS5)]
(text-embedding-004)    (Dates, Deadlines, Tags) (Keyword BM25)
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                ▼
                   [SQLite / Vector Store]
                                │
[User Query] ───────────────────┤
                                ▼
              [Stage 3: Hybrid Retrieval & Rerank]
               (Top K = 5 most relevant chunks)
                                │
                                ▼
              [Stage 4: Grounded Synthesis] ──► Gemini Flash (Strict Prompt)
                                │
                                ▼
             [Grounded Answer + Verbatim Quotes + Citation Links]
```

---

## 3. Ingestion & Content Understanding

### Multi-Modal Ingestion Strategy
1. **Plain Text & Markdown:** Direct tokenization and semantic chunking.
2. **PDF Documents:** 
   - Extract raw text with page markers.
   - For scanned/image-heavy PDFs, send page render images to Gemini Flash Vision.
3. **Images & Screenshots:**
   - Sent to Gemini Flash Vision with the Ingestion Extraction Prompt.
   - Extracts: Full transcription, visual description of diagrams/charts, and structured tags.

### Structured Entity Extraction Schema
During ingestion, Gemini extracts a JSON object containing:
```json
{
  "title": "CS210 Fall Syllabus - Grading & Late Policy",
  "summary": "Covers course overview, 15% daily penalty for late labs, and exam dates.",
  "document_type": "syllabus",
  "course_code": "CS210",
  "entities": {
    "deadlines": [
      {
        "item": "Lab 1 Submission",
        "date": "2026-10-15",
        "details": "Submitted via Gradescope before 11:59 PM"
      }
    ],
    "professors_instructors": ["Prof. Miller", "TA Sarah"],
    "key_topics": ["Data Structures", "Big-O Notation", "Binary Trees"]
  }
}
```

---

## 4. Grounded Retrieval & Answer Generation

### Context Assembly
When a query arrives:
1. Embed the query using `text-embedding-004`.
2. Retrieve Top-8 chunks via Vector Cosine Similarity and Top-8 chunks via BM25 full-text search.
3. Merge and deduplicate into Top-5 candidate chunks with composite score:
   $$\text{Score} = 0.6 \times \text{VectorSimilarity} + 0.4 \times \text{BM25Norm}$$
4. Wrap candidate chunks in XML tags with source metadata:
   ```xml
   <source id="SRC-1" file="CS210_Syllabus.pdf" page="3">
   Late Lab Policy: Labs submitted up to 24 hours late receive a 15% deduction. Beyond 48 hours, 0 credit is awarded.
   </source>
   ```

---

## 5. System Prompt Architecture

### Core Synthesis System Prompt
```text
You are Recall, a high-precision academic retrieval assistant.
Your goal is to answer the student's question STRICTLY using the provided source excerpts.

CRITICAL OPERATIONAL RULES:
1. SOURCE-FIRST TRUTH: You must ONLY use facts stated in the provided <sources>. Do NOT extrapolate, assume, or provide generic outside knowledge.
2. VERBATIM CITATIONS: Whenever stating a fact, cite the source ID immediately using the format [SRC-#].
3. DUAL OUTPUT FORMAT:
   - Provide a section "DIRECT_QUOTES" containing exact verbatim sentences from the source.
   - Provide a section "SYNTHESIS" containing a concise 2-3 sentence direct answer.
   - Provide a section "RELEVANCE_EXPLANATION" explaining in one sentence why this is the exact answer.
4. UNKNOWN / MISSING INFORMATION:
   If the answer cannot be found in the provided sources, you MUST respond:
   "STATUS: NOT_FOUND" followed by "The provided documents do not contain information regarding [topic]."
   NEVER make up or hypothesize an answer if it is not in the sources.
```

---

## 6. Confidence & Hallucination Prevention Protocol

| Risk Level | Trigger Condition | System Action |
| :--- | :--- | :--- |
| **High Confidence** (Direct Match) | Vector similarity > 0.78 and keyword match present | Present direct quotes prominently with green verified badge; generate synthesis. |
| **Moderate Confidence** (Semantic Match) | Vector similarity between 0.60–0.78 | Present synthesis with subtle caution notice: *"Synthesized from related topic in [File]"*. |
| **Low Confidence / No Match** | Vector similarity < 0.60 across all chunks | Do NOT trigger Gemini generation; directly display: *"No matching records found in your memories."* |

---

## 7. AI Failure Modes & Fallbacks

1. **OCR / Handwriting Illegibility:**
   - *Failure:* Whiteboard photo has handwriting that cannot be parsed with 100% confidence.
   - *Fallback:* Flag uncertain words with `[?]` and provide a high-resolution interactive thumbnail for manual review.
2. **Contradictory Sources (e.g., Syllabus vs. Email Announcement):**
   - *Behavior:* Gemini explicitly highlights the discrepancy:
     > *"Note: `Syllabus.pdf (Page 2)` lists the quiz on Oct 14, but `Email_Announcement.png` dated Oct 10 states it was rescheduled to Oct 16. The newer announcement is prioritized."*
3. **API Rate Limiting / Offline:**
   - *Fallback:* Fallback directly to lexical keyword search with exact chunk highlights, bypassing AI synthesis gracefully.

---

## 8. Privacy & Data Handling
* **No Model Training:** Gemini API calls utilize standard zero-data-retention enterprise/developer flags.
* **Client-Side Context Scrubbing:** Sensitive credentials (API keys, personal passwords) are filtered before ingestion chunking.
* **Local Identity Isolation:** Every memory is scoped to the user's isolated local database instance.
