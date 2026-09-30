-- ============================================================================
-- Recall Phase 4: Full-Text Search RPC Function
-- ============================================================================

CREATE OR REPLACE FUNCTION search_document_chunks(
    search_query TEXT,
    match_limit INT DEFAULT 10
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    source_id UUID,
    source_title TEXT,
    source_type TEXT,
    storage_path TEXT,
    page_number INT,
    chunk_index INT,
    raw_text TEXT,
    headline TEXT,
    rank FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    parsed_query TSQUERY;
BEGIN
    -- Parse natural-language search query into websearch tsquery, falling back to plainto_tsquery
    BEGIN
        parsed_query := websearch_to_tsquery('english', search_query);
    EXCEPTION WHEN OTHERS THEN
        parsed_query := plainto_tsquery('english', search_query);
    END;

    -- If parsed query is empty, return empty set
    IF parsed_query IS NULL OR parsed_query = ''::tsquery THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        dc.id AS chunk_id,
        dc.document_id,
        d.source_id,
        s.title AS source_title,
        s.source_type,
        s.storage_path,
        dc.page_number,
        dc.chunk_index,
        dc.raw_text,
        ts_headline(
            'english', 
            dc.raw_text, 
            parsed_query, 
            'StartSel = <mark class="bg-amber-100 text-amber-900 font-semibold px-1 py-0.5 rounded">, StopSel = </mark>, MaxWords=50, MinWords=20, ShortWord=3, HighlightAll=FALSE, MaxFragments=2, FragmentDelimiter=" ... "'
        ) AS headline,
        ts_rank_cd(dc.fts_tokens, parsed_query)::FLOAT AS rank
    FROM public.document_chunks dc
    JOIN public.documents d ON d.id = dc.document_id
    JOIN public.sources s ON s.id = d.source_id
    WHERE dc.user_id = auth.uid()
      AND dc.fts_tokens @@ parsed_query
    ORDER BY ts_rank_cd(dc.fts_tokens, parsed_query) DESC, dc.created_at DESC
    LIMIT match_limit;
END;
$$;
