import type { Database, Json } from './database';

export type ActivityEventType = 'app_focus' | 'browser_visit' | 'file_open' | 'custom';
export type PrivacyState = 'normal' | 'excluded' | 'synced' | 'local_only';

export type ActivityEvent = Database['public']['Tables']['activity_events']['Row'];
export type ActivityEventInsert = Database['public']['Tables']['activity_events']['Insert'];
export type ActivityEventUpdate = Database['public']['Tables']['activity_events']['Update'];

export interface TraceLocalEvent {
  id: string;
  eventType: ActivityEventType;
  application: string;
  windowTitle?: string | null;
  url?: string | null;
  filePath?: string | null;
  timestamp: string;
  durationSeconds?: number;
  metadata?: Json;
  privacyState?: PrivacyState;
  createdAt?: string;
}

export interface TracePrivacyRules {
  isPaused: boolean;
  excludedApplications: string[];
  excludedDomains: string[];
  syncEnabled: boolean;
}
