# Recall

> **"You already have the answer. Recall finds it."**

Recall is an AI-powered personal digital memory and retrieval engine designed specifically for students. It ingests the messy, unstructured artifacts of student life—course syllabi, lecture slide PDFs, whiteboard screenshots, assignment rubrics, and notes—and allows users to ask questions in natural language, retrieving verified answers backed by exact source citations.

---

## 📌 The Problem
Students accumulate hundreds of information fragments every week across slides, PDFs, notes, emails, and messaging apps. When working on assignments or studying for exams, they waste significant time hunting for specific formulas, late submission policies, or exam dates buried deep within documents. Traditional file search requires exact keywords, and generic AI chatbots often hallucinate generic answers rather than referencing the student's actual course materials.

---

## 💡 The Solution
Recall acts as an ambient cognitive index that:
1. **Ingests Multi-Modal Inputs:** Seamlessly processes PDFs, PNG/JPG screenshots, photos, and raw text notes.
2. **Separates Retrieval from AI Reasoning:** Uses fast hybrid search (vector embeddings + BM25 lexical search) to deterministically retrieve relevant document chunks before engaging the AI model.
3. **Grounds Answers in Source Documents:** Uses **Google Gemini** to synthesize answers while enforcing a strict distinction between **Verified Direct Quotes** and **AI Explanations**.
4. **Enables 1-Click Verification:** Every fact is linked directly to its original source page or screenshot bounding box.

---

## 📚 Complete Documentation Index

All architectural, functional, and design specifications are documented in the [`docs/`](file:///c:/Users/Sagar/Desktop/buildx/docs) directory:

| Document | Description |
| :--- | :--- |
| **[PRODUCT_VISION.md](file:///c:/Users/Sagar/Desktop/buildx/docs/PRODUCT_VISION.md)** | Core product philosophy, guiding principles, mission, and differentiation from traditional search & chatbots. |
| **[PRD.md](file:///c:/Users/Sagar/Desktop/buildx/docs/PRD.md)** | Product Requirements Document: user personas, pain points, MVP feature scope, functional/non-functional requirements, and success metrics. |
| **[USER_FLOWS.md](file:///c:/Users/Sagar/Desktop/buildx/docs/USER_FLOWS.md)** | Step-by-step user interaction flows: onboarding, file ingestion, natural-language search, source inspection, and organization. |
| **[AI_SPEC.md](file:///c:/Users/Sagar/Desktop/buildx/docs/AI_SPEC.md)** | Google Gemini integration specification, prompt engineering templates, grounding protocols, confidence metrics, and hallucination prevention. |
| **[TECH_SPEC.md](file:///c:/Users/Sagar/Desktop/buildx/docs/TECH_SPEC.md)** | Full technical architecture, database schemas (SQLite + FTS5), vector embedding strategy (`text-embedding-004`), API endpoint specifications, and environment variables. |
| **[UI_SPEC.md](file:///c:/Users/Sagar/Desktop/buildx/docs/UI_SPEC.md)** | Design system specification: light-first aesthetic, typography, component layout (Omnibar `⌘K`, Grounded Answer Container, Source Inspector), and UI state handling. |
| **[ROADMAP.md](file:///c:/Users/Sagar/Desktop/buildx/docs/ROADMAP.md)** | Phased development roadmap from Hackathon MVP (0–24 hrs) through Prototype v1, Prototype v2, and Production scaling. |

---

## 🛠️ Technology Stack Overview

* **Frontend:** Next.js (React 19 / TypeScript), Tailwind CSS, Lucide React, Radix UI Primitives
* **Backend / API:** Next.js Route Handlers / Lightweight FastAPI
* **AI & Multi-Modal Vision:** Google Gemini 2.5/1.5 Flash (`@google/genai`)
* **Vector Embeddings:** Google `text-embedding-004` (768 dimensions)
* **Storage & Search:** SQLite / LibSQL with FTS5 Full-Text Search + Vector Index (`sqlite-vec` / Chroma)
* **Document Processing:** PDF text parser (`pdfjs-dist` / `pdf-parse`) + Gemini Vision OCR for screenshots

---

## 🎯 Core Development Principles

* **Source-First Grounding:** Never guess or hallucinate. If the answer is not in the user's uploaded sources, state it clearly.
* **Separation of Concerns:** Retrieval (database vector/lexical search) and Reasoning (Gemini generation) are isolated architectural layers.
* **Light, Focused, Premium UX:** Fast, minimal, light-mode-first aesthetic with zero visual clutter or generic chatbot window paradigms.

---

## 🚦 Current Status
* **Phase:** Documentation & Architecture Complete (Pre-Implementation)
* **Next Step:** Implement Hackathon MVP core stack as outlined in [`ROADMAP.md`](file:///c:/Users/Sagar/Desktop/buildx/docs/ROADMAP.md).
