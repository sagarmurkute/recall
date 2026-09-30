import { supabase } from '../lib/supabase';
import type { Source } from '../types';

export interface SearchResultItem {
  chunkId: string;
  documentId: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: Source['source_type'];
  storagePath: string | null;
  pageNumber: number | null;
  chunkIndex: number;
  rawText: string;
  headline: string;
  rank: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  totalMatches: number;
  executionTimeMs: number;
  error?: string | null;
}

/**
 * Cleans natural-language question prefixes (e.g., "when is my...", "what is the...")
 * into optimized search terms while preserving core keywords.
 */
export function normalizeQuery(rawQuery: string): string {
  if (!rawQuery) return '';
  
  // Trim and remove special characters that break tsquery syntax
  const sanitized = rawQuery
    .replace(/[&|!():*<>^~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return sanitized;
}

/**
 * Creates client-side snippet highlighting if database ts_headline is unavailable.
 */
export function highlightText(text: string, query: string): string {
  if (!query || !text) return text;
  
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['what', 'when', 'where', 'which', 'who', 'how', 'the', 'and', 'for', 'are'].includes(w));

  if (keywords.length === 0) return text.slice(0, 300) + (text.length > 300 ? '...' : '');

  // Find first keyword index
  let firstIdx = -1;
  for (const kw of keywords) {
    const idx = text.toLowerCase().indexOf(kw);
    if (idx !== -1 && (firstIdx === -1 || idx < firstIdx)) {
      firstIdx = idx;
    }
  }

  const start = Math.max(0, firstIdx - 60);
  const end = Math.min(text.length, start + 350);
  let snippet = text.slice(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

export const searchService = {
  /**
   * Searches user's document chunks using PostgreSQL Full-Text Search.
   */
  async search(query: string, limit = 10): Promise<SearchResponse> {
    const startTime = performance.now();
    const cleanQuery = normalizeQuery(query);

    if (!cleanQuery) {
      return {
        query,
        results: [],
        totalMatches: 0,
        executionTimeMs: 0,
      };
    }

    try {
      // 1. Try PostgreSQL RPC Function: search_document_chunks
      const { data: rpcData, error: rpcError } = await supabase.rpc('search_document_chunks', {
        search_query: cleanQuery,
        match_limit: limit,
      });

      if (!rpcError && rpcData && Array.isArray(rpcData)) {
        const results: SearchResultItem[] = rpcData.map((item: Record<string, unknown>) => ({
          chunkId: String(item.chunk_id || ''),
          documentId: String(item.document_id || ''),
          sourceId: String(item.source_id || ''),
          sourceTitle: String(item.source_title || 'Untitled Document'),
          sourceType: (item.source_type as Source['source_type']) || 'other',
          storagePath: item.storage_path ? String(item.storage_path) : null,
          pageNumber: typeof item.page_number === 'number' ? item.page_number : null,
          chunkIndex: Number(item.chunk_index || 0),
          rawText: String(item.raw_text || ''),
          headline: String(item.headline || item.raw_text || ''),
          rank: Number(item.rank || 0),
        }));

        // Log search in background
        this.logSearch(query, results.length);

        return {
          query,
          results,
          totalMatches: results.length,
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      // 2. Direct Supabase Client Fallback (if RPC is not yet registered)
      const { data: fallbackChunks, error: fallbackError } = await supabase
        .from('document_chunks')
        .select(`
          id,
          document_id,
          chunk_index,
          page_number,
          raw_text,
          token_count,
          documents!inner (
            id,
            title,
            source_id,
            sources!inner (
              id,
              title,
              source_type,
              storage_path
            )
          )
        `)
        .textSearch('raw_text', cleanQuery, { type: 'websearch', config: 'english' })
        .limit(limit);

      if (fallbackError) {
        // If websearch fails, try simple ILIKE search as ultimate graceful fallback
        const { data: ilikeChunks, error: ilikeError } = await supabase
          .from('document_chunks')
          .select(`
            id,
            document_id,
            chunk_index,
            page_number,
            raw_text,
            token_count,
            documents!inner (
              id,
              title,
              source_id,
              sources!inner (
                id,
                title,
                source_type,
                storage_path
              )
            )
          `)
          .ilike('raw_text', `%${cleanQuery.split(' ')[0]}%`)
          .limit(limit);

        if (ilikeError) {
          throw new Error(`Search failed: ${fallbackError.message}`);
        }

        const fallbackResults = this.mapFallbackResults(ilikeChunks || [], cleanQuery);
        this.logSearch(query, fallbackResults.length);
        return {
          query,
          results: fallbackResults,
          totalMatches: fallbackResults.length,
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      const mappedResults = this.mapFallbackResults(fallbackChunks || [], cleanQuery);
      this.logSearch(query, mappedResults.length);

      return {
        query,
        results: mappedResults,
        totalMatches: mappedResults.length,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Search operation failed';
      console.error('[Recall] Search error:', err);
      return {
        query,
        results: [],
        totalMatches: 0,
        executionTimeMs: Math.round(performance.now() - startTime),
        error: errorMsg,
      };
    }
  },

  mapFallbackResults(chunks: unknown[], query: string): SearchResultItem[] {
    return chunks.map((item: unknown, idx: number) => {
      const c = item as Record<string, unknown>;
      const doc = c.documents as Record<string, unknown> | undefined;
      const src = doc?.sources as Record<string, unknown> | undefined;
      const rawText = String(c.raw_text || '');

      return {
        chunkId: String(c.id || ''),
        documentId: String(c.document_id || ''),
        sourceId: String(src?.id || doc?.source_id || ''),
        sourceTitle: String(src?.title || doc?.title || 'Untitled Source'),
        sourceType: (src?.source_type as Source['source_type']) || 'other',
        storagePath: src?.storage_path ? String(src.storage_path) : null,
        pageNumber: typeof c.page_number === 'number' ? c.page_number : null,
        chunkIndex: Number(c.chunk_index || 0),
        rawText,
        headline: highlightText(rawText, query),
        rank: Math.max(0.1, 1 - idx * 0.1),
      };
    });
  },

  async logSearch(queryText: string, resultCount: number) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      await supabase.from('search_history').insert({
        user_id: authData.user.id,
        query_text: queryText,
        result_count: resultCount,
      });
    } catch {
      // Non-blocking log
    }
  },
};
