export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          icon: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sources: {
        Row: {
          id: string;
          user_id: string;
          collection_id: string | null;
          source_type: 'pdf' | 'image' | 'note' | 'txt' | 'screenshot' | 'other';
          title: string;
          storage_bucket: string;
          storage_path: string | null;
          mime_type: string | null;
          file_size_bytes: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          collection_id?: string | null;
          source_type: 'pdf' | 'image' | 'note' | 'txt' | 'screenshot' | 'other';
          title: string;
          storage_bucket?: string;
          storage_path?: string | null;
          mime_type?: string | null;
          file_size_bytes?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          collection_id?: string | null;
          source_type?: 'pdf' | 'image' | 'note' | 'txt' | 'screenshot' | 'other';
          title?: string;
          storage_bucket?: string;
          storage_path?: string | null;
          mime_type?: string | null;
          file_size_bytes?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          source_id: string;
          title: string;
          summary: string | null;
          page_count: number;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_id: string;
          title: string;
          summary?: string | null;
          page_count?: number;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_id?: string;
          title?: string;
          summary?: string | null;
          page_count?: number;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_chunks: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          chunk_index: number;
          page_number: number | null;
          raw_text: string;
          token_count: number;
          extracted_entities: Json;
          fts_tokens?: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          chunk_index: number;
          page_number?: number | null;
          raw_text: string;
          token_count?: number;
          extracted_entities?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          chunk_index?: number;
          page_number?: number | null;
          raw_text?: string;
          token_count?: number;
          extracted_entities?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      search_history: {
        Row: {
          id: string;
          user_id: string;
          query_text: string;
          result_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          query_text: string;
          result_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          query_text?: string;
          result_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_document_chunks: {
        Args: {
          search_query: string;
          match_limit?: number;
        };
        Returns: {
          chunk_id: string;
          document_id: string;
          source_id: string;
          source_title: string;
          source_type: string;
          storage_path: string | null;
          page_number: number | null;
          chunk_index: number;
          raw_text: string;
          headline: string;
          rank: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
