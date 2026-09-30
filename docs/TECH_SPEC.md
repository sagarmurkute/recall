# Recall — Technical Architecture Specification

---

## 1. Architectural Overview & System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (React + Vite + TS)                       │
│  - React 19 + TypeScript + Tailwind CSS                                     │
│  - Supabase Client SDK (Auth, Storage, DB with RLS)                         │
│  - Omnibar Search (⌘K), Grounded Answer Viewer, Split-Screen Inspector      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JWT Auth Bearer
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                SUPABASE BACKEND & SECURE EDGE FUNCTIONS                      │
│                                                                             │
│  ┌───────────────────────────────┐     ┌──────────────────────────────────┐ │
│  │   Edge Function: /ingest-file │     │   Edge Function: /query-memory   │ │
│  │   - Gemini Vision OCR         │     │   - Generate query vector        │ │
│  │   - Semantic chunking         │     │   - Hybrid search RPC in PG      │ │
│  │   - text-embedding generation │     │   - Grounded Gemini synthesis    │ │
│  └───────────────┬───────────────┘     └─────────────────┬────────────────┘ │
│                  │                                       │                  │
│                  └───────────────────┬───────────────────┘                  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                   POSTGRESQL DATABASE & STORAGE                       │  │
│  │  - pgvector extension (768-dim embeddings)                            │  │
│  │  - PostgreSQL Full-Text Search (tsvector / GIN index)                 │  │
│  │  - Strict Row Level Security (RLS) on all user data                   │  │
│  │  - Supabase Storage (Private user_files bucket + signed URLs)         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Server-side API Secret (Protected)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             GOOGLE GEMINI API                               │
│  - Configurable Model: GEMINI_MODEL (e.g., gemini-2.5-flash / 1.5-flash)    │
│  - Configurable Embeddings: GEMINI_EMBEDDING_MODEL (text-embedding-004)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Separation of Concerns: Retrieval vs. AI Reasoning

Recall strictly decouples the **Retrieval Layer** from the **Generative Reasoning Layer**:

1. **Deterministic Retrieval Layer (PostgreSQL + pgvector):**
   - User queries are converted to dense vector embeddings.
   - Vector cosine distance (`<=>`) finds semantically adjacent content.
   - Lexical search (`tsvector @@ websearch_to_tsquery`) matches exact keyword tokens (e.g. course codes, specific room numbers).
   - Reciprocal rank fusion produces the Top-5 most relevant source chunks.

2. **Reasoning & Grounding Layer (Google Gemini):**
   - Receives *only* the retrieved candidate chunks.
   - Extracts verbatim quotes and creates a concise synthesis.
   - Emits citation tokens `[SRC-#]` mapped to the actual chunk IDs.
   - Enforces a strict refusal protocol if no matching information is found in the provided sources.

---

## 3. Technology Stack & Component Specifications

### 3.1 Frontend Stack (Hackathon MVP)
* **Framework:** React 19 with Vite (Fast HMR, minimal overhead).
* **Language:** TypeScript for type safety across API contracts and schemas.
* **Styling:** Tailwind CSS with custom light-mode tokens (warm slate, clean indigo accents).
* **Icons & Headless UI:** Lucide React, Radix UI Dialog / Dropdown / Tooltip primitives.
* **Data Access:** `@supabase/supabase-js` (Auth, Storage signed URLs, and direct table queries via RLS).

### 3.2 Backend & Storage (Supabase)
* **Auth:** Supabase Auth for user identity and tenant isolation (`auth.uid()`).
* **Storage:** Private bucket `user_files` supporting PDF, PNG, JPG, and TXT files (25MB limit).
* **Database:** Managed PostgreSQL with `pgvector` and `uuid-ossp` extensions.
* **Edge Functions:** Deno-based Supabase Edge Functions (`ingest-file`, `query-memory`) keeping AI secrets completely off the client.

### 3.3 Google Gemini AI Configuration
* **Configurable Model Architecture:** To avoid hard-coded outdated models, all model calls reference environment variables:
  - `GEMINI_MODEL`: Generative synthesis & vision OCR (e.g., `gemini-2.5-flash`, `gemini-1.5-flash`).
  - `GEMINI_EMBEDDING_MODEL`: Semantic embeddings (e.g., `text-embedding-004`).
* *Note: Prior to execution, active model identifiers must be confirmed against Google Gemini API availability.*

---

## 4. Environment Variables Configuration

### Frontend Environment (`.env.local` / Vite)
```env
# Supabase Public Configuration (Safe for Client)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsIn..."
```

### Server / Supabase Edge Secrets (`supabase/.env` or Dashboard Secrets)
```env
# Google Gemini API Secrets (SERVER-SIDE ONLY - NEVER EXPOSE TO CLIENT)
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-2.5-flash"
GEMINI_EMBEDDING_MODEL="text-embedding-004"

# Supabase Service Role (For trusted Edge Function administrative tasks)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsIn..."
```

---

## 5. Security & Isolation Matrix

| Layer | Security Rule / Protection Mechanism |
| :--- | :--- |
| **API Keys** | Gemini API key and Supabase `service_role` key exist **only** in server-side Edge Functions. |
| **Row Level Security** | All 8 database tables have RLS enabled with `USING (auth.uid() = user_id)`. |
| **Storage Security** | Storage bucket is private; files are served to client via 60-minute signed URLs. |
| **File Validation** | Upload handler validates MIME types (`application/pdf`, `image/png`, `image/jpeg`, `text/plain`) and rejects payloads > 25MB. |

---

## 6. Architecture Lifecycle: Hackathon vs. Production

| Dimension | Hackathon MVP | Post-Hackathon v1 | Production v2 |
| :--- | :--- | :--- | :--- |
| **Ingestion Vectors** | Manual Drag-and-Drop (PDF, PNG, JPG, TXT) | Gmail, Google Drive, Chrome Clipper, WhatsApp bot | Canvas LMS, Notion sync, cross-device background sync |
| **Search Engine** | Hybrid `pgvector` + PostgreSQL `tsvector` | Re-ranking model (Cohere / Cross-Encoder) | Multi-tenant distributed vector index (Qdrant / Pinecone) |
| **Processing** | Synchronous Edge Function execution | Asynchronous job queues (BullMQ / Redis) | Dedicated multi-worker OCR & embedding cluster |
| **Observability** | Console logs & Supabase Edge logs | OpenTelemetry & LangSmith tracing | Real-time APM, automated latency alerts & rate limiting |
| **Access Control** | Single-user personal RLS isolation | Study group / team collection sharing | Enterprise SSO (SAML / Okta), audit logs, compliance |
