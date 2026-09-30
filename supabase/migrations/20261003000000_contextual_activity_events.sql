-- ============================================================================
-- Recall: Contextual Activity Events Migration (Trace Integration)
-- ============================================================================

-- Table for contextual memory events synced from Trace.exe or ambient collectors
CREATE TABLE IF NOT EXISTS public.activity_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('app_focus', 'browser_visit', 'file_open', 'custom')),
    application TEXT NOT NULL,
    window_title TEXT,
    url TEXT,
    file_path TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    privacy_state TEXT DEFAULT 'synced',
    fts_tokens TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(window_title, '') || ' ' || 
            COALESCE(application, '') || ' ' || 
            COALESCE(url, '')
        )
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast temporal and full-text contextual retrieval
CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON public.activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_timestamp ON public.activity_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_application ON public.activity_events(application);
CREATE INDEX IF NOT EXISTS idx_activity_events_fts ON public.activity_events USING GIN(fts_tokens);

-- Row Level Security (RLS) Policies
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity events"
    ON public.activity_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity events"
    ON public.activity_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity events"
    ON public.activity_events FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity events"
    ON public.activity_events FOR DELETE
    USING (auth.uid() = user_id);
