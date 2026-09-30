import type { Database } from './database';

export * from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Collection = Database['public']['Tables']['collections']['Row'];
export type CollectionInsert = Database['public']['Tables']['collections']['Insert'];
export type CollectionUpdate = Database['public']['Tables']['collections']['Update'];

export type Source = Database['public']['Tables']['sources']['Row'];
export type SourceInsert = Database['public']['Tables']['sources']['Insert'];
export type SourceUpdate = Database['public']['Tables']['sources']['Update'];

export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

export type DocumentChunk = Database['public']['Tables']['document_chunks']['Row'];
export type DocumentChunkInsert = Database['public']['Tables']['document_chunks']['Insert'];
export type DocumentChunkUpdate = Database['public']['Tables']['document_chunks']['Update'];

export type SearchHistory = Database['public']['Tables']['search_history']['Row'];
export type SearchHistoryInsert = Database['public']['Tables']['search_history']['Insert'];
export type SearchHistoryUpdate = Database['public']['Tables']['search_history']['Update'];

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string | null;
  hasAnonKey: boolean;
  error?: string | null;
}
