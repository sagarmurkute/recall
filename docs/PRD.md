# Recall — Product Requirements Document (PRD)

---

## 1. Product Overview
**Recall** is an intelligent, multi-modal personal memory and retrieval platform tailored for students. Built with **React, Vite, TypeScript, Tailwind CSS, and Supabase (PostgreSQL with `pgvector`)**, it ingests messy study inputs—screenshots of slides, course PDFs, lecture transcripts, syllabus documents, Discord/WhatsApp announcements, and notes—and allows users to retrieve exact answers with verified source grounding using **Google Gemini**.

---

## 2. Problem Statement
Students encounter hundreds of disparate information sources every week. When studying or working on assignments, they waste up to 20–30 minutes per day hunting for specific formulas, project requirements, exam dates, or office hour policies buried across unstructured files. 
Existing search solutions require exact keyword matches and cannot parse screenshots or complex PDFs effectively, while generic AI chatbots hallucinate generic answers rather than referencing the student's actual materials.

---

## 3. Target Users & Personas

### Persona A: The Multi-Course Undergrad ("Alex")
* **Profile:** 2nd-year STEM student taking 5 classes simultaneously.
* **Behaviors:** Takes phone photos of whiteboards, downloads 30-page lecture slide decks, receives assignment clarifications in WhatsApp groups.
* **Core Need:** "I need to find the exact grading criteria my TA posted three weeks ago without scrolling through 500 chat messages."

### Persona B: The Graduate / Research Student ("Maya")
* **Profile:** Masters student reading dozens of academic research papers and documentation.
* **Behaviors:** Highlights PDF passages, saves diagrams, tracks methodologies across multiple papers.
* **Core Need:** "I need to ask questions across 15 downloaded papers like 'Which paper used ResNet-50 with Cosine Annealing?' and see the exact page."

### Persona C: The Crammer / Exam Prep Student ("Devon")
* **Profile:** Student preparing for midterm exams 48 hours in advance.
* **Behaviors:** Has a backlog of unorganized lecture decks and homework solutions.
* **Core Need:** "Show me all practice problems related to Dijkstra's algorithm across my homework and lecture slides."

---

## 4. User Pain Points
1. **The Screenshot Graveyard:** Snapping a picture of a slide or whiteboard is effortless, but finding it two months later in a camera roll is nearly impossible.
2. **PDF Information Traps:** Syllabi and lecture decks contain critical policies and facts buried deep in multi-page unstructured layouts.
3. **Context Switching & Fragmentation:** Information is split across Canvas/Blackboard, messaging apps, local folders, and cloud drives.
4. **False Confidence from Chatbots:** Using standard ChatGPT often gives generalized programming or scientific answers that conflict with the specific professor's required methodology.

---

## 5. Product Goals & Non-Goals

### Product Goals
* Provide sub-3-second natural language retrieval across ingested personal files.
* Deliver multi-modal ingestion (images, screenshots, PDFs, plaintext, markdown) stored securely in **Supabase Storage**.
* Provide two-tier answers: **Direct Verbatim Quotes** vs. **AI-Synthesized Explanations**.
* Guarantee 1-click navigation to the exact source context (document page, image preview, timestamp).
* Maintain strict tenant isolation and data security via **PostgreSQL Row Level Security (RLS)**.

### Non-Goals (Out of Scope)
* **Not a Note-Taking Editor:** Recall is not a replacement for Notion, Obsidian, or Google Docs. It does not provide rich-text document editing.
* **Not a Generic Web Search Engine:** Recall queries only the user's private data pool; it does not replace Google for general web queries.
* **Not an Unbounded Chatbot:** Recall does not conduct open-ended creative conversations; every interaction is focused on finding, citing, and synthesizing the user's stored knowledge.
* **Not a Full LMS:** Recall does not handle course registration, assignment submission, or peer grading.

---

## 6. Feature Specifications

### 6.1 Core Features (Full Product Scope)
1. **Multi-Modal Universal Ingestion:** Drag-and-drop upload of PDFs, PNGs/JPEGs (screenshots, photos), plain text notes, and markdown into Supabase Storage.
2. **Unified Search & Omnibar (`⌘K`):** Natural-language query interface supporting keyword and semantic search.
3. **Dual-Layer Retrieval Engine:** PostgreSQL Full-Text Search (`tsvector`) combined with semantic vector search (`pgvector` + `text-embedding-004`) for high precision and recall.
4. **Grounded Gemini AI Answer Engine:** Server-side Edge Function invokes Google Gemini to generate answers with citation tokens linked directly to source chunks.
5. **Interactive Source Inspector:** Split-screen viewer rendering the original document/image with the referenced snippet highlighted.
6. **Automatic Structured Fact Extractor:** Extracts dates, deadlines, tasks, and key terminology during ingestion.
7. **Collections / Course Folders:** Groups memories and sources by course code (e.g., `#CS210`, `#CHEM101`).

---

## 7. MVP vs. Future Features Matrix

| Feature | Hackathon MVP | Prototype v1 | Production v2 |
| :--- | :---: | :---: | :---: |
| React + Vite + Tailwind Frontend | ✅ Yes | ✅ Yes | ✅ Yes |
| Supabase Auth & Storage (PDF, PNG, JPG, TXT) | ✅ Yes | ✅ Yes | ✅ Yes |
| Gemini Flash Vision OCR & Extraction (Server-side) | ✅ Yes | ✅ Yes | ✅ Yes |
| PostgreSQL + `pgvector` + FTS Hybrid Search | ✅ Yes | ✅ Yes | ✅ Yes |
| Row Level Security (RLS) on all user data | ✅ Yes | ✅ Yes | ✅ Yes |
| AI Answer with Direct Quote vs. Synthesis Distinction | ✅ Yes | ✅ Yes | ✅ Yes |
| Split-Screen / Modal Source Inspector with Signed URLs | ✅ Yes | ✅ Yes | ✅ Yes |
| Chrome Web Clipper Extension | ❌ No | ✅ Yes | ✅ Yes |
| Gmail & Google Drive Cloud Importers | ❌ No | ✅ Yes | ✅ Yes |
| WhatsApp / Telegram Forwarding Bot | ❌ No | ✅ Yes | ✅ Yes |
| Autonomous Study & Exam Cram Agents | ❌ No | ❌ No | ✅ Yes |

---

## 8. User Stories

1. **US-01 (Natural Language Search):** *As a student, I want to type "what is the penalty for late lab submissions" so that I immediately see the late policy without reading the whole syllabus.*
2. **US-02 (Screenshot Retrieval):** *As a student, I want to upload a photo of a whiteboard diagram and later search for words written on that whiteboard so that I can review exam formulas.*
3. **US-03 (Source Verification):** *As a student, I want every AI response to highlight the exact document name and page number so that I can verify the answer before trusting it for an exam.*
4. **US-04 (Deadline Identification):** *As a student, I want Recall to highlight extracted due dates from my syllabus so that I don't miss assignment deadlines.*
5. **US-05 (Secure Access):** *As a student, I want my uploaded course files and notes to be completely private to my account via secure authentication and Row Level Security.*

---

## 9. Functional Requirements

* **FR-01 (Ingestion):** System accepts files up to 25MB (PDF, PNG, JPG, TXT) uploaded to Supabase Storage.
* **FR-02 (Secure Edge Processing):** Supabase Edge Function processes files using Gemini Vision OCR and structured extraction without exposing API keys to the browser.
* **FR-03 (pgvector Indexing):** Content chunked (400 tokens / 50 overlap) and indexed into PostgreSQL `extracted_content` and `embeddings` (`pgvector` with 768-dim `text-embedding-004`).
* **FR-04 (Hybrid Retrieval RPC):** `match_memories` PostgreSQL RPC combines cosine distance and `ts_rank` lexical scoring.
* **FR-05 (Grounded Synthesis):** Gemini prompt instructs the model to answer using *only* retrieved chunks and output standard citation markers `[SRC-#]`.
* **FR-06 (Source Inspector):** Clicking a citation marker opens the original document via a temporary signed URL and highlights the exact text fragment.

---

## 10. Non-Functional & Security Requirements

* **Security & Auth:** Strict Supabase Row Level Security (RLS) on all tables; no service-role or Gemini keys exposed to the client.
* **Performance:** End-to-end search query and synthesis response under 2.5 seconds.
* **Accuracy & Grounding:** Zero ungrounded factual hallucinations in synthetic answers (>95% citation verification rate).
* **Storage Privacy:** User uploaded files stored in private Supabase Storage buckets accessible only through temporary signed URLs.

---

## 11. Success Metrics

1. **Query Success Rate:** ≥ 90% of user queries return relevant source chunks in the top 3 results.
2. **Time to Answer:** Average time from pressing `Enter` to reading verified answer < 3.0 seconds.
3. **Source Verification Rate:** ≥ 60% of search interactions result in a user clicking through to verify the original source.
4. **Real Supabase Integration:** 100% of memories, files, and queries operate on live Supabase Auth, PostgreSQL, and Storage.
