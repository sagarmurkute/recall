import React, { useRef, useState } from 'react';
import { sourcesService } from '../services/sourcesService';
import { UploadCloud, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  userId: string;
  onUploadComplete: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ userId, onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Process single file at a time for Phase 2
    setError(null);
    setSuccess(null);
    setUploading(true);
    setProgressStatus(`Uploading "${file.name}" to private storage...`);

    try {
      const { data, error: uploadErr } = await sourcesService.uploadSourceFile(file, userId);

      if (uploadErr || !data) {
        setError(uploadErr?.message || 'Failed to upload file.');
      } else {
        setSuccess(`"${file.name}" uploaded successfully and recorded in sources!`);
        onUploadComplete();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setError(msg);
    } finally {
      setUploading(false);
      setProgressStatus(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
        } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.png,.jpg,.jpeg,.md"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            ) : (
              <UploadCloud className="w-6 h-6 text-blue-600" />
            )}
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-800">
              {uploading ? 'Processing Upload...' : 'Drop your files here, or click to browse'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supports <span className="font-medium text-slate-700">PDF, TXT, PNG, JPG</span> up to 25MB
            </p>
          </div>

          {/* Supported Format Badges */}
          <div className="flex items-center space-x-2 pt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <FileText className="w-3 h-3 mr-1 text-slate-500" />
              PDF / TXT
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <ImageIcon className="w-3 h-3 mr-1 text-slate-500" />
              PNG / JPG
            </span>
          </div>
        </div>
      </div>

      {/* Upload State Feedback */}
      {uploading && progressStatus && (
        <div className="mt-3.5 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800 flex items-center space-x-2.5">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
          <span className="font-medium">{progressStatus}</span>
        </div>
      )}

      {error && (
        <div className="mt-3.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div className="mt-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{success}</div>
        </div>
      )}
    </div>
  );
};
