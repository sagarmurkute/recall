import React, { useState } from 'react';
import type { SearchResultItem, SearchResponse } from '../services/searchService';
import type { Source } from '../types';
import { sourcesService } from '../services/sourcesService';
import { 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  File, 
  ExternalLink, 
  Layers, 
  Loader2, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  FileQuestion 
} from 'lucide-react';

interface SearchResultsViewProps {
  response: SearchResponse | null;
  loading: boolean;
  searched: boolean;
  onOpenChunkInspector?: (sourceId: string) => void;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  response,
  loading,
  searched,
  onOpenChunkInspector,
}) => {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const getSourceIcon = (sourceType: Source['source_type']) => {
    switch (sourceType) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'image':
      case 'screenshot':
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
      case 'txt':
      case 'note':
        return <FileCode className="w-4 h-4 text-emerald-500" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleOpenSignedUrl = async (result: SearchResultItem) => {
    if (!result.storagePath) return;
    setOpeningId(result.chunkId);
    setActionError(null);

    try {
      const { signedUrl, error } = await sourcesService.getStorageSignedUrl(result.storagePath);
      if (error || !signedUrl) {
        setActionError(`Failed to generate signed URL: ${error?.message || 'Unknown error'}`);
      } else {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error opening source file';
      setActionError(msg);
    } finally {
      setOpeningId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Searching your uploaded document chunks...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3 bg-slate-100 rounded w-full"></div>
                <div className="h-3 bg-slate-100 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!searched) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
        <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-800">Ready to search your documents</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Type a question or keywords above. Recall will search through all your uploaded syllabi, slides, and notes.
        </p>
      </div>
    );
  }

  if (response?.error) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2.5">
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Search Error: </span>
          {response.error}
        </div>
      </div>
    );
  }

  if (!response || response.results.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
        <FileQuestion className="w-8 h-8 text-amber-500 mx-auto" />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">No matching passages found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            We couldn't find any passages in your uploaded files matching <span className="font-medium text-slate-700">"{response?.query}"</span>.
          </p>
        </div>
        <div className="pt-2 text-[11px] text-slate-400">
          Tip: Try searching for broader terms like "syllabus", "assignment", or "schedule".
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {actionError}
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-slate-900">
            Found {response.totalMatches} relevant {response.totalMatches === 1 ? 'passage' : 'passages'}
          </span>
          <span>for "{response.query}"</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">{response.executionTimeMs}ms</span>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {response.results.map((result, idx) => (
          <div
            key={result.chunkId || idx}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
          >
            {/* Card Header: Source Title, Page badge, Type */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/60 shrink-0">
                  {getSourceIcon(result.sourceType)}
                </div>
                <div className="truncate">
                  <span className="font-semibold text-sm text-slate-900 truncate block" title={result.sourceTitle}>
                    {result.sourceTitle}
                  </span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    {result.pageNumber && (
                      <span className="inline-flex items-center text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        Page {result.pageNumber}
                      </span>
                    )}
                    <span className="text-[11px] font-mono uppercase text-slate-400">
                      {result.sourceType}
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Chunk #{result.chunkIndex}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {result.storagePath && (
                  <button
                    onClick={() => handleOpenSignedUrl(result)}
                    disabled={openingId === result.chunkId}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-colors cursor-pointer"
                    title="Open original document via secure signed link"
                  >
                    {openingId === result.chunkId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Open File</span>
                  </button>
                )}

                {onOpenChunkInspector && (
                  <button
                    onClick={() => onOpenChunkInspector(result.sourceId)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Inspect Chunks"
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Matched Passages Context Box */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs text-slate-800 leading-relaxed font-sans">
              <div
                dangerouslySetInnerHTML={{ __html: result.headline || result.rawText }}
                className="whitespace-pre-wrap"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
