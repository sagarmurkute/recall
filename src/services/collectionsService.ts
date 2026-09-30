import { supabase } from '../lib/supabase';
import type { Collection, CollectionInsert, CollectionUpdate } from '../types';

export const collectionsService = {
  async getCollections(): Promise<{ data: Collection[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('name', { ascending: true });

    return { data, error };
  },

  async getCollectionById(id: string): Promise<{ data: Collection | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  async createCollection(collection: CollectionInsert): Promise<{ data: Collection | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('collections')
      .insert(collection)
      .select()
      .single();

    return { data, error };
  },

  async updateCollection(id: string, updates: CollectionUpdate): Promise<{ data: Collection | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('collections')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async deleteCollection(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    return { error };
  },
};
