import { supabase } from '../lib/supabase';
import type { SearchHistory, SearchHistoryInsert } from '../types';

export const searchHistoryService = {
  async getRecentSearches(limit = 10): Promise<{ data: SearchHistory[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  async recordSearch(entry: SearchHistoryInsert): Promise<{ data: SearchHistory | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('search_history')
      .insert(entry)
      .select()
      .single();

    return { data, error };
  },

  async clearSearchHistory(): Promise<{ error: Error | null }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { error: null };

    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userData.user.id);

    return { error };
  },
};
