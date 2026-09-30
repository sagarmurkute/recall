# Recall

> **"You already have the answer. Recall finds it."**

Recall is an AI-powered personal digital memory and retrieval engine designed specifically for students. It ingests the messy, unstructured artifacts of student life—course syllabi, lecture slide PDFs, whiteboard screenshots, assignment rubrics, and notes—and allows users to ask questions in natural language, retrieving verified answers backed by exact source citations.

---

## 📌 The Problem
Students accumulate hundreds of information fragments every week across slides, PDFs, notes, emails, and messaging apps. When working on assignments or studying for exams, they waste significant time hunting for specific formulas, late submission policies, or exam dates buried deep within documents. Traditional file search requires exact keywords, and generic AI chatbots often hallucinate generic answers rather than referencing the student's actual course materials.

---

## 💡 The Solution
Recall acts as an ambient cognitive index that:
1. **Ingests Multi-Modal Inputs:** Seamlessly processes PDFs, PNG/JPG screenshots, photos, and raw text notes into secure **Supabase Storage**.
2. **Separates Retrieval from AI Reasoning:** Uses PostgreSQL **Hybrid Search** (`pgvector` + Full-Text Search `tsvector`) to deterministically retrieve relevant document chunks before engaging the AI model.
3. **Grounds Answers in Source Documents:** Uses **Google Gemini** via secure Supabase Edge Functions to synthesize answers while enforcing a strict distinction between **Verified Direct Quotes** and **AI Explanations**.
4. **Guarantees Privacy & Verification:** Row Level Security (RLS) protects user data, and every fact is linked directly to its original source page or screenshot view via temporary signed URLs.

---

## 🛠️ Technology Architecture

* **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Lucide React, Radix UI
* **Backend & Auth:** Supabase (Auth, PostgreSQL, Row Level Security, Edge Functions)
* **Storage:** Supabase Storage (Private Buckets for PDFs, screenshots, notes)
* **Database & Search:** PostgreSQL with `pgvector` (768-dim embeddings) and Full-Text Search (`tsvector` / `tsquery`)
* **AI Provider:** Google Gemini 2.5 / 1.5 Flash (Vision OCR & Grounded Synthesis) via secure Edge Functions
* **Embedding Model:** Google `text-embedding-004`
* **Security:** Strict Row Level Security (RLS), private Supabase Storage, and zero client-side API key exposure

---

## 📚 Complete Documentation Index

All architectural, functional, and design specifications are documented in the [`docs/`](file:///c:/Users/Sagar/Desktop/buildx/docs) directory:

| Document | Description |
| :--- | :--- |
| **[PRODUCT_VISION.md](file:///c:/Users/Sagar/Desktop/buildx/docs/PRODUCT_VISION.md)** | Core product philosophy, guiding principles, mission, and differentiation from traditional search & chatbots. |
| **[PRD.md](file:///c:/Users/Sagar/Desktop/buildx/docs/PRD.md)** | Product Requirements Document: user personas, pain points, MVP feature scope, functional/non-functional requirements, and success metrics. |
| **[USER_FLOWS.md](file:///c:/Users/Sagar/Desktop/buildx/docs/USER_FLOWS.md)** | Step-by-step user interaction flows: onboarding, file ingestion, hybrid natural-language search, source inspection, and organization. |
| **[AI_SPEC.md](file:///c:/Users/Sagar/Desktop/buildx/docs/AI_SPEC.md)** | Google Gemini specification: strict separation between deterministic vector/lexical retrieval and Gemini reasoning, prompt templates, citation tokens `[SRC-#]`, and hallucination prevention. |
| **[TECH_SPEC.md](file:///c:/Users/Sagar/Desktop/buildx/docs/TECH_SPEC.md)** | Full technical architecture: React + Vite + Tailwind frontend, Supabase Auth/Storage/Edge Functions, PostgreSQL + `pgvector` schemas, RLS policies, and hybrid search RPC. |
| **[UI_SPEC.md](file:///c:/Users/Sagar/Desktop/buildx/docs/UI_SPEC.md)** | Design system specification: light-first aesthetic, Tailwind tokens, Omnibar (`⌘K`), two-tier Grounded Answer Container, split-screen source inspector, and UI state handling. |
| **[ROADMAP.md](file:///c:/Users/Sagar/Desktop/buildx/docs/ROADMAP.md)** | Phased development roadmap from Hackathon MVP (0–24 hrs) through Prototype v1 (Gmail, Drive, WhatsApp), Prototype v2, and Production scaling. |

---

## 🚦 Current Status
* **Phase:** Documentation & Architecture Aligned with React/Vite + Supabase/pgvector + Gemini Stack
* **Next Step:** Ready for implementation of the Hackathon MVP.
