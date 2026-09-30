import { supabase } from '../lib/supabase';
import type { User, Session, AuthResponse } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const authService = {
  async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });
    return response;
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return response;
  },

  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getUser(): Promise<{ user: User | null; error: Error | null }> {
    const { data, error } = await supabase.auth.getUser();
    return { user: data?.user || null, error };
  },

  async getSession(): Promise<{ session: Session | null; error: Error | null }> {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session || null, error };
  },

  onAuthStateChange(callback: (session: Session | null, user: User | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session, session?.user || null);
    });
    return data.subscription;
  },
};
