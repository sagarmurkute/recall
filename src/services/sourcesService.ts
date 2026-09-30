import { supabase } from '../lib/supabase';
import type { Source, SourceInsert, SourceUpdate } from '../types';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'text/plain',
  'text/markdown',
];

export function determineSourceType(mimeType: string, filename: string): Source['source_type'] {
  const lower = filename.toLowerCase();
  if (mimeType.includes('pdf') || lower.endsWith('.pdf')) return 'pdf';
  if (mimeType.includes('image') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return 'image';
  }
  if (mimeType.includes('text') || lower.endsWith('.txt') || lower.endsWith('.md')) return 'txt';
  return 'other';
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
    };
  }

  const isMimeValid = SUPPORTED_MIME_TYPES.includes(file.type);
  const lowerName = file.name.toLowerCase();
  const hasValidExt = 
    lowerName.endsWith('.pdf') || 
    lowerName.endsWith('.png') || 
    lowerName.endsWith('.jpg') || 
    lowerName.endsWith('.jpeg') || 
    lowerName.endsWith('.txt') || 
    lowerName.endsWith('.md');

  if (!isMimeValid && !hasValidExt) {
    return {
      valid: false,
      error: `Unsupported file format. Please upload PDF, TXT, PNG, or JPG files.`,
    };
  }

  return { valid: true };
}

export const sourcesService = {
  async getSources(collectionId?: string): Promise<{ data: Source[] | null; error: Error | null }> {
    let query = supabase
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (collectionId) {
      query = query.eq('collection_id', collectionId);
    }

    const { data, error } = await query;
    return { data: (data as Source[]) || null, error };
  },

  async getSourceById(id: string): Promise<{ data: Source | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('id', id)
      .single();

    return { data: (data as Source) || null, error };
  },

  async createSource(source: SourceInsert): Promise<{ data: Source | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('sources')
      .insert(source)
      .select()
      .single();

    return { data: (data as Source) || null, error };
  },

  async updateSource(id: string, updates: SourceUpdate): Promise<{ data: Source | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('sources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data: (data as Source) || null, error };
  },

  async deleteSource(id: string, storagePath?: string | null): Promise<{ error: Error | null }> {
    // 1. Delete storage file if path is provided
    if (storagePath) {
      try {
        await supabase.storage.from('user_files').remove([storagePath]);
      } catch (storageErr) {
        console.warn('[Recall] Could not remove storage file:', storageErr);
      }
    }

    // 2. Delete database record (cascades to documents and chunks if any)
    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', id);

    return { error };
  },

  async uploadSourceFile(
    file: File,
    userId: string,
    collectionId?: string
  ): Promise<{ data: Source | null; error: Error | null }> {
    // 1. Client-side file validation
    const validation = validateFile(file);
    if (!validation.valid) {
      return { data: null, error: new Error(validation.error) };
    }

    // 2. Generate source ID and storage path
    const sourceId = crypto.randomUUID();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${sourceId}/${sanitizedName}`;
    const sourceType = determineSourceType(file.type, file.name);

    // 3. Upload to private Supabase Storage bucket 'user_files'
    const { error: uploadError } = await supabase.storage
      .from('user_files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      return { data: null, error: new Error(`Storage upload failed: ${uploadError.message}`) };
    }

    // 4. Create record in PostgreSQL sources table
    const newSource: SourceInsert = {
      id: sourceId,
      user_id: userId,
      collection_id: collectionId || null,
      source_type: sourceType,
      title: file.name,
      storage_bucket: 'user_files',
      storage_path: storagePath,
      mime_type: file.type || 'application/octet-stream',
      file_size_bytes: file.size,
      metadata: {
        status: 'uploaded',
        original_filename: file.name,
        uploaded_at: new Date().toISOString(),
      },
    };

    const { data: sourceRecord, error: dbError } = await supabase
      .from('sources')
      .insert(newSource)
      .select()
      .single();

    if (dbError) {
      // Clean up orphaned storage file if DB insert failed
      await supabase.storage.from('user_files').remove([storagePath]);
      return { data: null, error: new Error(`Database record failed: ${dbError.message}`) };
    }

    return { data: sourceRecord as Source, error: null };
  },

  async getStorageSignedUrl(
    storagePath: string,
    bucket = 'user_files',
    expiresIn = 3600
  ): Promise<{ signedUrl: string | null; error: Error | null }> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn);

    return { signedUrl: data?.signedUrl || null, error };
  },
};
