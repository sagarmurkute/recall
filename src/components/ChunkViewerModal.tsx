import React, { useEffect, useState, useCallback } from 'react';
import type { Source, DocumentChunk, Document } from '../types';
import { documentsService } from '../services/documentsService';
import { processingPipeline } from '../services/processingPipeline';
import { 
  X, 
  Layers, 
  FileText, 
  RefreshCw, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles 
} from 'lucide-react';

interface ChunkViewerModalProps {
  source: Source;
  userId: string;
  onClose: () => void;
  onSourceUpdated: () => void;
}

export const ChunkViewerModal: React.FC<ChunkViewerModalProps> = ({
  source,
  userId,
  onClose,
  onSourceUpdated,
}) => {
  const [doc, setDoc] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chunks' | 'raw'>('chunks');

  const meta = (source.metadata as Record<string, unknown>) || {};
  const status = typeof meta.status === 'string' ? meta.status : 'uploaded';
  const errorMessage = typeof meta.error_message === 'string' ? meta.error_message : null;

  const loadDocumentAndChunks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: docs } = await documentsService.getDocuments(source.id);
      if (docs && docs.length > 0) {
        const currentDoc = docs[0];
        setDoc(currentDoc);
        const { data: chunkList } = await documentsService.getDocumentChunks(currentDoc.id);
        setChunks(chunkList || []);
      } else {
        setDoc(null);
        setChunks([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load chunks';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [source.id]);

  useEffect(() => {
    loadDocumentAndChunks();
  }, [loadDocumentAndChunks]);

  const handleTriggerProcessing = async () => {
    setProcessing(true);
    setError(null);
    try {
      const result = await processingPipeline.processSource(source, userId);
      if (!result.success) {
        setError(result.error || 'Extraction failed');
      } else {
        await loadDocumentAndChunks();
        onSourceUpdated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing error';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3 overflow-hidden pr-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-semibold text-slate-900 truncate" title={source.title}>
                {source.title}
              </h3>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-[11px] font-mono text-slate-500">
                  ID: {source.id.slice(0, 8)}...
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-[11px] font-mono uppercase font-semibold text-slate-600">
                  {source.source_type}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleTriggerProcessing}
              disabled={processing}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
              title="Re-run text extraction and chunking"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${processing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{processing ? 'Extracting...' : 'Extract & Chunk'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Bar & Stats */}
        <div className="px-6 py-3 bg-slate-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Status:</span>
            {status === 'ready' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                Ready ({chunks.length} chunks)
              </span>
            )}
            {status === 'processing' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Loader2 className="w-3 h-3 mr-1 animate-spin text-blue-600" />
                Processing
              </span>
            )}
            {status === 'uploaded' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3 mr-1 text-amber-600" />
                Uploaded (Pending Extraction)
              </span>
            )}
            {status === 'failed' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-3 h-3 mr-1 text-red-600" />
                Failed
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-slate-500 font-mono text-[11px]">
            {doc && <span>Pages: {doc.page_count}</span>}
            <span>Chunks: {chunks.length}</span>
            <span>
              Tokens: {chunks.reduce((acc, c) => acc + (c.token_count || 0), 0)}
            </span>
          </div>
        </div>

        {/* Error banner if present */}
        {(error || errorMessage) && (
          <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Extraction notice: </span>
              {error || errorMessage}
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-white">
          <button
            onClick={() => setActiveTab('chunks')}
            className={`pb-2.5 text-xs font-semibold mr-6 border-b-2 transition-colors ${
              activeTab === 'chunks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Chunks List ({chunks.length})
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'raw'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Combined Raw Text
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/30">
          {loading || processing ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                {processing ? 'Extracting text and chunking document...' : 'Loading document chunks...'}
              </p>
            </div>
          ) : chunks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">No chunks generated yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                This source has not been parsed yet. Click the "Extract & Chunk" button above to extract readable text.
              </p>
            </div>
          ) : activeTab === 'chunks' ? (
            <div className="space-y-3">
              {chunks.map((chunk, idx) => (
                <div
                  key={chunk.id || idx}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        Chunk #{chunk.chunk_index}
                      </span>
                      {chunk.page_number && (
                        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          Page {chunk.page_number}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      ~{chunk.token_count} tokens &bull; {chunk.raw_text.length} chars
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {chunk.raw_text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <pre className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                {chunks.map((c) => c.raw_text).join('\n\n---\n\n')}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-1 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Phase 3 Content Extraction & Chunking Layer</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
