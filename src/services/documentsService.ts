import { supabase } from '../lib/supabase';
import type { 
  Document, 
  DocumentInsert, 
  DocumentUpdate, 
  DocumentChunk, 
  DocumentChunkInsert 
} from '../types';

export const documentsService = {
  async getDocuments(sourceId?: string): Promise<{ data: Document[] | null; error: Error | null }> {
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (sourceId) {
      query = query.eq('source_id', sourceId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async getDocumentById(id: string): Promise<{ data: Document | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  async createDocument(doc: DocumentInsert): Promise<{ data: Document | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('documents')
      .insert(doc)
      .select()
      .single();

    return { data, error };
  },

  async updateDocument(id: string, updates: DocumentUpdate): Promise<{ data: Document | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async deleteDocument(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    return { error };
  },

  async getDocumentChunks(documentId: string): Promise<{ data: DocumentChunk[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true });

    return { data, error };
  },

  async insertDocumentChunks(chunks: DocumentChunkInsert[]): Promise<{ data: DocumentChunk[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('document_chunks')
      .insert(chunks)
      .select();

    return { data, error };
  },
};
