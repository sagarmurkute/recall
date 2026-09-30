import React, { useState } from 'react';
import type { Source } from '../types';
import { sourcesService } from '../services/sourcesService';
import { processingPipeline } from '../services/processingPipeline';
import { 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  File, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  FolderArchive,
  Layers,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface SourceListProps {
  sources: Source[];
  loading: boolean;
  userId: string;
  onRefresh: () => void;
  onSelectSourceForChunks?: (source: Source) => void;
}

export const SourceList: React.FC<SourceListProps> = ({ 
  sources, 
  loading, 
  userId,
  onRefresh, 
  onSelectSourceForChunks 
}) => {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (isoString: string): string => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  const handleOpenSignedUrl = async (source: Source, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!source.storage_path) return;
    setOpeningId(source.id);
    setActionError(null);

    try {
      const { signedUrl, error } = await sourcesService.getStorageSignedUrl(source.storage_path);
      if (error || !signedUrl) {
        setActionError(`Failed to generate signed URL: ${error?.message || 'Unknown error'}`);
      } else {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error opening file';
      setActionError(msg);
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = async (source: Source, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${source.title}" from Recall?`)) return;
    setDeletingId(source.id);
    setActionError(null);

    try {
      const { error } = await sourcesService.deleteSource(source.id, source.storage_path);
      if (error) {
        setActionError(`Failed to delete source: ${error.message}`);
      } else {
        onRefresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting source';
      setActionError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleProcess = async (source: Source, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(source.id);
    setActionError(null);

    try {
      const result = await processingPipeline.processSource(source, userId);
      if (!result.success) {
        setActionError(`Extraction failed for "${source.title}": ${result.error}`);
      }
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing error';
      setActionError(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatus = (source: Source): { status: string; chunkCount?: number } => {
    const meta = source.metadata as Record<string, unknown> | null;
    const status = typeof meta?.status === 'string' ? meta.status : 'uploaded';
    const chunkCount = typeof meta?.chunk_count === 'number' ? meta.chunk_count : undefined;
    return { status, chunkCount };
  };

  const renderStatusBadge = (status: string, chunkCount?: number) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Ready {chunkCount !== undefined && `(${chunkCount} chunks)`}
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Loader2 className="w-3 h-3 mr-1 animate-spin text-blue-600" />
            Processing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3 mr-1 text-red-600" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 mr-1 text-amber-600" />
            Uploaded
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">Your Stored Sources</h2>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {sources.length}
          </span>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading stored sources...</p>
        </div>
      ) : sources.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <FolderArchive className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No sources uploaded yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Drop your PDFs, screenshots, or notes above to store and extract searchable chunks.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 font-medium">Source / File</th>
                  <th className="py-3.5 px-4 font-medium">Type</th>
                  <th className="py-3.5 px-4 font-medium">Size</th>
                  <th className="py-3.5 px-4 font-medium">Extraction Status</th>
                  <th className="py-3.5 px-4 font-medium">Uploaded</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.map((source) => {
                  const { status, chunkCount } = getStatus(source);
                  const isBusy = processingId === source.id;

                  return (
                    <tr 
                      key={source.id} 
                      onClick={() => onSelectSourceForChunks && onSelectSourceForChunks(source)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/60 shrink-0">
                            {getSourceIcon(source.source_type)}
                          </div>
                          <div className="truncate max-w-[220px] sm:max-w-xs">
                            <span className="font-medium text-slate-900 truncate block" title={source.title}>
                              {source.title}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 truncate block">
                              {source.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="uppercase font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {source.source_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {formatFileSize(source.file_size_bytes)}
                      </td>
                      <td className="py-3 px-4">
                        {renderStatusBadge(status, chunkCount)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(source.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          {/* Process / Re-Process Button */}
                          <button
                            onClick={(e) => handleProcess(source, e)}
                            disabled={isBusy}
                            className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors"
                            title={status === 'ready' ? 'Re-extract text and chunks' : 'Extract text and create chunks'}
                          >
                            {isBusy ? (
                              <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                            ) : (
                              <Play className="w-3 h-3 text-slate-600" />
                            )}
                            <span className="hidden sm:inline">
                              {status === 'ready' ? 'Re-Chunk' : 'Process'}
                            </span>
                          </button>

                          {/* Inspect Chunks Button */}
                          <button
                            onClick={() => onSelectSourceForChunks && onSelectSourceForChunks(source)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            title="Inspect Extracted Chunks"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>

                          {/* Open Storage View */}
                          {source.storage_path && (
                            <button
                              onClick={(e) => handleOpenSignedUrl(source, e)}
                              disabled={openingId === source.id}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                              title="Open Private Storage View (Signed URL)"
                            >
                              {openingId === source.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={(e) => handleDelete(source, e)}
                            disabled={deletingId === source.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Delete Source"
                          >
                            {deletingId === source.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
