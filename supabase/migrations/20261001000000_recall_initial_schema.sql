-- ============================================================================
-- Recall Database Foundation Migration (Phase 1)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- PROFILES (Maps 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- COLLECTIONS (Organize materials into courses or projects, e.g. "CS210")
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#2563EB',
    icon TEXT DEFAULT 'folder',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SOURCES (Tracks origin files, screenshots, uploads, notes)
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('pdf', 'image', 'note', 'txt', 'screenshot', 'other')),
    title TEXT NOT NULL,
    storage_bucket TEXT DEFAULT 'user_files',
    storage_path TEXT, -- e.g. "{user_id}/{source_id}/{original_filename}"
    mime_type TEXT,
    file_size_bytes BIGINT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- DOCUMENTS (Ingested cognitive document items)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    page_count INTEGER DEFAULT 1,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- DOCUMENT_CHUNKS (Parsed text chunks and full-text search tokens)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER, -- NULL for single images or raw text notes
    raw_text TEXT NOT NULL,
    token_count INTEGER DEFAULT 0,
    extracted_entities JSONB DEFAULT '{}'::jsonb,
    fts_tokens TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', raw_text)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SEARCH_HISTORY (Audit log of user queries and search activity)
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    result_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 3. INDEXES FOR PERFORMANCE AND RETRIEVAL
-- ============================================================================

-- Ownership & Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON public.sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_collection_id ON public.sources(collection_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_source_id ON public.documents(source_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON public.document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);

-- Timestamp Indexes
CREATE INDEX IF NOT EXISTS idx_sources_created_at ON public.sources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);

-- Full-Text Search GIN Index
CREATE INDEX IF NOT EXISTS idx_document_chunks_fts ON public.document_chunks USING GIN(fts_tokens);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- COLLECTIONS POLICIES
CREATE POLICY "Users can view their own collections"
    ON public.collections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
    ON public.collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
    ON public.collections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
    ON public.collections FOR DELETE
    USING (auth.uid() = user_id);

-- SOURCES POLICIES
CREATE POLICY "Users can view their own sources"
    ON public.sources FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sources"
    ON public.sources FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sources"
    ON public.sources FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sources"
    ON public.sources FOR DELETE
    USING (auth.uid() = user_id);

-- DOCUMENTS POLICIES
CREATE POLICY "Users can view their own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
    ON public.documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
    ON public.documents FOR DELETE
    USING (auth.uid() = user_id);

-- DOCUMENT_CHUNKS POLICIES
CREATE POLICY "Users can view their own document chunks"
    ON public.document_chunks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document chunks"
    ON public.document_chunks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own document chunks"
    ON public.document_chunks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own document chunks"
    ON public.document_chunks FOR DELETE
    USING (auth.uid() = user_id);

-- SEARCH_HISTORY POLICIES
CREATE POLICY "Users can view their own search history"
    ON public.search_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history"
    ON public.search_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history"
    ON public.search_history FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 5. AUTOMATIC PROFILE CREATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 6. STORAGE BUCKET & STORAGE RLS SETUP
-- ============================================================================

-- Create private storage bucket for user files (if storage schema exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user_files',
    'user_files',
    FALSE,
    26214400, -- 25MB in bytes
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/markdown']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 26214400,
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/markdown'];

-- Storage object RLS: Users can only upload and read files in their own folder: {user_id}/*
CREATE POLICY "Users can upload their own files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'user_files'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can read their own files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'user_files'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own files"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'user_files'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'user_files'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
