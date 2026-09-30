import { supabase } from '../lib/supabase';
import type { ActivityEvent, ActivityEventInsert } from '../types';

export interface ActivityFilterOptions {
  eventType?: ActivityEvent['event_type'];
  application?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const activityService = {
  /**
   * Retrieves recent contextual activity events for the authenticated user.
   */
  async getRecentActivity(
    options: ActivityFilterOptions = {}
  ): Promise<{ data: ActivityEvent[] | null; error: Error | null }> {
    const limit = options.limit || 25;
    let query = supabase
      .from('activity_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (options.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options.application) {
      query = query.ilike('application', `%${options.application}%`);
    }

    if (options.startDate) {
      query = query.gte('timestamp', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('timestamp', options.endDate);
    }

    const { data, error } = await query;
    return { data: (data as ActivityEvent[]) || null, error };
  },

  /**
   * Inserts a batch of contextual activity events synced from Trace.exe.
   */
  async insertActivityEvents(
    events: ActivityEventInsert[]
  ): Promise<{ data: ActivityEvent[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('activity_events')
      .insert(events)
      .select();

    return { data: (data as ActivityEvent[]) || null, error };
  },

  /**
   * Searches contextual activity events using Full-Text Search.
   */
  async searchActivity(
    queryText: string,
    limit = 10
  ): Promise<{ data: ActivityEvent[] | null; error: Error | null }> {
    if (!queryText.trim()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('activity_events')
      .select('*')
      .textSearch('fts_tokens', queryText, { type: 'websearch', config: 'english' })
      .order('timestamp', { ascending: false })
      .limit(limit);

    return { data: (data as ActivityEvent[]) || null, error };
  },

  /**
   * Purges contextual activity events (privacy control).
   */
  async purgeActivity(
    options: { eventIds?: string[]; beforeTimestamp?: string } = {}
  ): Promise<{ error: Error | null }> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return { error: null };

    let query = supabase
      .from('activity_events')
      .delete()
      .eq('user_id', authData.user.id);

    if (options.eventIds && options.eventIds.length > 0) {
      query = query.in('id', options.eventIds);
    } else if (options.beforeTimestamp) {
      query = query.lte('timestamp', options.beforeTimestamp);
    }

    const { error } = await query;
    return { error };
  },
};
