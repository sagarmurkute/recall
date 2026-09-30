import { supabase, isSupabaseConfigured } from './supabase';

export interface BackendStatusReport {
  isConfigured: boolean;
  isConnected: boolean;
  supabaseUrl: string | null;
  authSessionActive: boolean;
  message: string;
  checkedAt: string;
}

export async function checkSupabaseConnection(): Promise<BackendStatusReport> {
  const url = import.meta.env.VITE_SUPABASE_URL || null;
  const hasAnonKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (!isSupabaseConfigured || !url || !hasAnonKey) {
    return {
      isConfigured: false,
      isConnected: false,
      supabaseUrl: url,
      authSessionActive: false,
      message: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.',
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    // Check if auth service responds
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return {
        isConfigured: true,
        isConnected: false,
        supabaseUrl: url,
        authSessionActive: false,
        message: `Connection error: ${sessionError.message}`,
        checkedAt: new Date().toISOString(),
      };
    }

    return {
      isConfigured: true,
      isConnected: true,
      supabaseUrl: url,
      authSessionActive: Boolean(sessionData?.session),
      message: 'Successfully connected to Supabase backend.',
      checkedAt: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown connection error';
    return {
      isConfigured: true,
      isConnected: false,
      supabaseUrl: url,
      authSessionActive: false,
      message: `Failed to reach Supabase: ${errorMsg}`,
      checkedAt: new Date().toISOString(),
    };
  }
}
