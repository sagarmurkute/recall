# Recall — Supabase Database & Storage Schema Specification

> **Note:** This document provides the proposed initial SQL migration and storage architecture for Recall. This migration structure is ready to be executed during Phase 1 of implementation.

---

## 1. Entity Architecture & Relationships

```
                     ┌──────────────────┐
                     │   auth.users     │
                     └────────┬─────────┘
                              │ 1:1
                              ▼
                     ┌──────────────────┐
                     │     profiles     │
                     └────────┬─────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │ 1:N                               │ 1:N
            ▼                                   ▼
   ┌─────────────────┐                 ┌─────────────────┐
   │   collections   │                 │ search_history  │
   └────────┬────────┘                 └─────────────────┘
            │ 0..1:N
            ▼
   ┌─────────────────┐
   │     sources     │
   └────────┬────────┘
            │ 1:N
            ├───────────────────────────────────┐
            ▼                                   ▼
   ┌─────────────────┐                 ┌─────────────────┐
   │      files      │                 │    memories     │
   │(Supabase Storage│                 │(High-level item)│
   │  path metadata) │                 └────────┬────────┘
   └─────────────────┘                          │ 1:N
                                                ▼
                                       ┌─────────────────┐
                                       │extracted_content│
                                       │ (Text Chunks +  │
                                       │   FTS tsvector) │
                                       └────────┬────────┘
                                                │ 1:1
                                                ▼
                                       ┌─────────────────┐
                                       │   embeddings    │
                                       │ (pgvector 768d) │
                                       └─────────────────┘
```

---

## 2. Proposed Initial SQL Migration (`001_initial_schema.sql`)

```sql
-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- 2. TABLES & ENTITIES
-- ============================================================================

-- PROFILES (Maps 1:1 with auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COLLECTIONS (Optional course folders, e.g. "CS210", "CHEM101")
CREATE TABLE public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#2563EB',
    icon TEXT DEFAULT 'folder',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOURCES (Logical container of imported content)
CREATE TABLE public.sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('file_upload', 'manual_note', 'gmail', 'gdrive', 'whatsapp', 'url')),
    title TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FILES (Binary storage metadata referencing Supabase Storage)
CREATE TABLE public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    storage_bucket TEXT NOT NULL DEFAULT 'user_files',
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    page_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEMORIES (Cognitive memory entity created from a source)
CREATE TABLE public.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXTRACTED_CONTENT (Chunked text, entities & Full-Text Search tsvector)
CREATE TABLE public.extracted_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER, -- NULL for single images or raw text notes
    raw_text TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    extracted_entities JSONB DEFAULT '{}'::jsonb,
    fts_tokens TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', raw_text)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMBEDDINGS (pgvector 768-dim vector storage)
CREATE TABLE public.embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    extracted_content_id UUID NOT NULL REFERENCES public.extracted_content(id) ON DELETE CASCADE,
    embedding VECTOR(768) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEARCH_HISTORY (Audit log of user queries and retrieval counts)
CREATE TABLE public.search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    result_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================
CREATE INDEX idx_sources_user_id ON public.sources(user_id);
CREATE INDEX idx_files_source_id ON public.files(source_id);
CREATE INDEX idx_memories_user_id ON public.memories(user_id);
CREATE INDEX idx_extracted_content_memory_id ON public.extracted_content(memory_id);
CREATE INDEX idx_extracted_content_fts ON public.extracted_content USING GIN(fts_tokens);
CREATE INDEX idx_embeddings_vector ON public.embeddings USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own collections" ON public.collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own sources" ON public.sources FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own files" ON public.files FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own memories" ON public.memories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own extracted_content" ON public.extracted_content FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own embeddings" ON public.embeddings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own search_history" ON public.search_history FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 5. HYBRID SEARCH RPC FUNCTION (pgvector + tsvector)
-- ============================================================================
CREATE OR REPLACE FUNCTION match_memories(
    query_embedding VECTOR(768),
    query_text TEXT,
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    content_id UUID,
    memory_id UUID,
    source_title TEXT,
    raw_text TEXT,
    page_number INT,
    extracted_entities JSONB,
    similarity_score FLOAT,
    lexical_rank FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id AS content_id,
        ec.memory_id,
        m.title AS source_title,
        ec.raw_text,
        ec.page_number,
        ec.extracted_entities,
        (1 - (emb.embedding <=> query_embedding))::FLOAT AS similarity_score,
        COALESCE(ts_rank(ec.fts_tokens, websearch_to_tsquery('english', query_text)), 0)::FLOAT AS lexical_rank
    FROM public.extracted_content ec
    JOIN public.memories m ON m.id = ec.memory_id
    JOIN public.embeddings emb ON emb.extracted_content_id = ec.id
    WHERE ec.user_id = auth.uid()
      AND (
          (1 - (emb.embedding <=> query_embedding)) > match_threshold
          OR ec.fts_tokens @@ websearch_to_tsquery('english', query_text)
      )
    ORDER BY (
        (0.65 * (1 - (emb.embedding <=> query_embedding))) +
        (0.35 * COALESCE(ts_rank(ec.fts_tokens, websearch_to_tsquery('english', query_text)), 0))
    ) DESC
    LIMIT match_count;
END;
$$;
```

---

## 3. Storage Bucket Configuration

* **Bucket ID:** `user_files`
* **Public Access:** `false` (Private bucket).
* **Allowed MIME Types:**
  - `application/pdf`
  - `image/png`
  - `image/jpeg`
  - `text/plain`
  - `text/markdown`
* **Max File Size:** 25MB (`26,214,400 bytes`).
* **Path Convention:** `{user_id}/{source_id}/{filename}`
* **Storage RLS:**
  - `INSERT`: Allowed if `bucket_id = 'user_files'` and `auth.uid()::text = (storage.foldername(name))[1]`.
  - `SELECT`: Served to authorized owners via short-lived (60-minute) signed URLs.

---

## 4. Future Migration & Scaling Considerations
1. **Multi-Modal Vector Embeddings:** When adding image vector embeddings, extend `embeddings` with a `modality` column (`text` vs. `image`).
2. **Additional Ingestion Types:** `sources.source_type` can seamlessly accept `'gmail'`, `'gdrive'`, `'whatsapp'`, `'canvas'`.
3. **Partitioning:** For massive scale post-hackathon, partition `extracted_content` and `embeddings` by `user_id`.
