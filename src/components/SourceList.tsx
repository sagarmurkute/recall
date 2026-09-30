import React, { useState } from 'react';
import type { Source } from '../types';
import { sourcesService } from '../services/sourcesService';
import { 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  File, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  FolderArchive 
} from 'lucide-react';

interface SourceListProps {
  sources: Source[];
  loading: boolean;
  onRefresh: () => void;
}

export const SourceList: React.FC<SourceListProps> = ({ sources, loading, onRefresh }) => {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const handleOpenSignedUrl = async (source: Source) => {
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

  const handleDelete = async (source: Source) => {
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

  const getStatus = (source: Source): string => {
    const meta = source.metadata as Record<string, unknown> | null;
    return typeof meta?.status === 'string' ? meta.status : 'uploaded';
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
            Drop your PDFs, screenshots, or notes above to store them in your private memory vault.
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
                  <th className="py-3.5 px-4 font-medium">Status</th>
                  <th className="py-3.5 px-4 font-medium">Uploaded</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.map((source) => {
                  const status = getStatus(source);
                  return (
                    <tr key={source.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200/60 shrink-0">
                            {getSourceIcon(source.source_type)}
                          </div>
                          <div className="truncate max-w-[240px] sm:max-w-xs">
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(source.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {source.storage_path && (
                            <button
                              onClick={() => handleOpenSignedUrl(source)}
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
                          <button
                            onClick={() => handleDelete(source)}
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
