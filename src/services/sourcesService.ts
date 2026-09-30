import { supabase } from '../lib/supabase';
import type { Source, SourceInsert, SourceUpdate } from '../types';

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
    return { data, error };
  },

  async getSourceById(id: string): Promise<{ data: Source | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  async createSource(source: SourceInsert): Promise<{ data: Source | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('sources')
      .insert(source)
      .select()
      .single();

    return { data, error };
  },

  async updateSource(id: string, updates: SourceUpdate): Promise<{ data: Source | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('sources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async deleteSource(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', id);

    return { error };
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
