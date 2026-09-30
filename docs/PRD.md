# Recall — Product Requirements Document (PRD)

---

## 1. Product Overview
**Recall** is an intelligent, multi-modal personal memory and retrieval platform tailored for students. It ingests messy, heterogeneous study inputs—screenshots of slides, course PDFs, lecture transcripts, syllabus documents, Discord/WhatsApp announcements, and web snippets—and allows users to retrieve exact answers with verified source grounding using natural language.

---

## 2. Problem Statement
Students encounter hundreds of disparate information sources every week. When studying or working on assignments, they waste up to 20–30 minutes per day hunting for specific formulas, project requirements, exam dates, or office hour policies buried across unstructured files. 
Existing search solutions require exact keyword matches and cannot parse screenshots or complex PDFs effectively, while generic AI chatbots hallucinate generic answers rather than referencing the student's actual materials.

---

## 3. Target Users & Personas

### Persona A: The Multi-Course Undergrad ("Alex")
* **Profile:** 2nd-year STEM student taking 5 classes simultaneously.
* **Behaviors:** Takes fast phone photos of whiteboards, downloads 30-page lecture slide decks, receives assignment clarifications in WhatsApp groups.
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
* Deliver multi-modal ingestion (images, screenshots, PDFs, plaintext, markdown).
* Provide two-tier answers: **Direct Verbatim Quotes** vs. **AI-Synthesized Answers**.
* Guarantee 1-click navigation to the exact source context (document page, image preview, timestamp).
* Enable automatic extraction of structured entities (deadlines, dates, project tasks, professor rules).

### Non-Goals (Out of Scope)
* **Not a Note-Taking Editor:** Recall is not a replacement for Notion, Obsidian, or Google Docs. It does not provide rich-text document editing.
* **Not a Generic Web Search Engine:** Recall queries only the user's private data pool; it does not replace Google for general web queries.
* **Not an Unbounded Chatbot:** Recall does not conduct open-ended creative conversations; every interaction is focused on finding, citing, and synthesizing the user's stored knowledge.
* **Not a Full LMS:** Recall does not handle course registration, assignment submission, or peer grading.

---

## 6. Feature Specifications

### 6.1 Core Features (Full Product Scope)
1. **Multi-Modal Universal Ingestion:** Drag-and-drop support for PDFs, PNGs/JPEGs (screenshots, photos), plain text notes, markdown files, and web URLs.
2. **Unified Search & Omnibar (`⌘K`):** Natural-language query interface with instant auto-complete and search filters.
3. **Dual-Layer Retrieval Engine:** Lexical search (BM25) combined with semantic vector search for high precision and recall.
4. **Grounded Gemini AI Answer Engine:** Generates synthesized answers with citation tokens linked directly to source chunks.
5. **Interactive Source Inspector:** Split-screen or modal viewer that renders the original document/image with the referenced snippet highlighted.
6. **Automatic Structured Fact Extractor:** Extracts dates, deadlines, tasks, and key terminology during ingestion.
7. **Semantic Memory Graph & Related Nodes:** Suggests related items (e.g., lecture notes related to an assignment rubric) based on semantic proximity.

---

## 7. MVP vs. Future Features Matrix

| Feature | Hackathon MVP | Prototype v1 | Production v2 |
| :--- | :---: | :---: | :---: |
| Drag-and-Drop Ingestion (PDF, PNG, JPG, TXT) | ✅ Yes | ✅ Yes | ✅ Yes |
| Gemini Vision OCR & Extraction | ✅ Yes | ✅ Yes | ✅ Yes |
| Vector & Lexical Hybrid Search | ✅ Yes | ✅ Yes | ✅ Yes |
| AI Answer Generation with Source Citations | ✅ Yes | ✅ Yes | ✅ Yes |
| Split-Screen / Modal Source Inspector | ✅ Yes | ✅ Yes | ✅ Yes |
| Structured Fact Badges (Dates, Deadlines) | ✅ Yes | ✅ Yes | ✅ Yes |
| Direct Quote vs. AI Summary Distinction | ✅ Yes | ✅ Yes | ✅ Yes |
| Chrome Web Clipper Extension | ❌ No | ✅ Yes | ✅ Yes |
| WhatsApp / Telegram Forwarding Bot | ❌ No | ✅ Yes | ✅ Yes |
| Auto-sync with Google Drive / Canvas LMS | ❌ No | ❌ No | ✅ Yes |
| Local On-Device Embeddings / Offline Mode | ❌ No | ❌ No | ✅ Yes |

---

## 8. User Stories

1. **US-01 (Natural Language Search):** *As a student, I want to type "what is the penalty for late lab submissions" so that I immediately see the late policy without reading the whole syllabus.*
2. **US-02 (Screenshot Retrieval):** *As a student, I want to upload a photo of a whiteboard diagram and later search for words written on that whiteboard so that I can review exam formulas.*
3. **US-03 (Source Verification):** *As a student, I want every AI response to highlight the exact document name and page number so that I can verify the answer before trusting it for an exam.*
4. **US-04 (Deadline Identification):** *As a student, I want Recall to highlight extracted due dates from my syllabus so that I don't miss assignment deadlines.*
5. **US-05 (Multi-Document Synthesis):** *As a student, I want to ask "what are all topics covered in Midterm 1" and have Recall pull points across 4 separate lecture decks into a consolidated list.*

---

## 9. Functional Requirements

* **FR-01 (Ingestion):** System must accept files up to 25MB (PDF, PNG, JPG, TXT, MD) and process them asynchronously within 5 seconds.
* **FR-02 (Text & Visual Extraction):** System must extract text, headings, and visual diagrams using Gemini Vision / OCR parsers.
* **FR-03 (Chunking & Indexing):** Content must be chunked with semantic boundaries (300–500 tokens with 10% overlap) and indexed into a vector store and full-text search index.
* **FR-04 (Hybrid Retrieval):** Search queries must query both lexical (keyword) and vector (semantic) indices, reranking the top 5 most relevant chunks.
* **FR-05 (Grounded Prompting):** Gemini prompt must instruct the model to answer using *only* the retrieved chunks and output standard citation markers `[Source #ID]`.
* **FR-06 (Source Inspector):** Clicking a citation marker must open the source card and highlight the exact text fragment.
* **FR-07 (Fact Extraction):** The ingestion pipeline must tag detected dates, course codes, and action items as metadata.

---

## 10. Non-Functional Requirements

* **Performance:** Search and initial citation response latency under 2.5 seconds.
* **Accuracy & Grounding:** Zero ungrounded factual hallucinations in synthetic answers (>95% citation verification rate).
* **Usability:** Clean, light, minimal aesthetic with zero configuration needed from the user.
* **Reliability:** Graceful handling of corrupted files, unparseable images, or rate-limited AI queries with explicit error banners.
* **Security & Privacy:** Local data retention or encrypted user stores; no public indexing of personal student files.

---

## 11. Success Metrics

1. **Query Success Rate:** ≥ 90% of user queries return relevant source chunks in the top 3 results.
2. **Time to Answer:** Average time from pressing `Enter` to reading verified answer < 3.0 seconds.
3. **Source Verification Rate:** ≥ 60% of search interactions result in a user clicking through to verify the original source (indicating active trust and utility).
4. **Ingestion Friction:** < 3 seconds user effort to drag, drop, and auto-index any document.

---

## 12. Risks and Mitigation Strategies

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Low Quality / Blurry Screenshots** | High (OCR failure) | Pre-process images with contrast enhancement; use Gemini 1.5/2.0 Flash Vision with fallback to user text annotations. |
| **Hallucination in Complex Syntheses** | Critical | Strict system prompts, negative constraints ("If not present, output: UNKNOWN"), and side-by-side verbatim quotes. |
| **High API Cost / Latency** | Medium | Use lightweight embeddings for retrieval; use fast Gemini Flash models for extraction and synthesis; cache frequent queries. |
| **Complex Multi-page PDF Parsing** | Medium | Extract text with page-level bounding/chunking to retain exact page numbers for citation links. |
