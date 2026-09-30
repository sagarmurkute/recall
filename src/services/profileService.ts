import { supabase } from '../lib/supabase';
import type { Profile, ProfileUpdate } from '../types';

export const profileService = {
  async getCurrentProfile(): Promise<{ data: Profile | null; error: Error | null }> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { data: null, error: userError };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    return { data, error };
  },

  async updateProfile(updates: ProfileUpdate): Promise<{ data: Profile | null; error: Error | null }> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { data: null, error: userError };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userData.user.id)
      .select()
      .single();

    return { data, error };
  },
};
