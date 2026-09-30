import type { Source, DocumentChunk, ActivityEvent } from './index';

export type MemoryType = 'explicit' | 'contextual';

export interface ExplicitMemoryItem {
  type: 'explicit';
  source: Source;
  chunk: DocumentChunk;
  pageNumber: number | null;
  relevanceScore: number;
}

export interface ContextualMemoryItem {
  type: 'contextual';
  event: ActivityEvent;
  application: string;
  windowTitle: string | null;
  url: string | null;
  timestamp: string;
  durationSeconds: number;
  relevanceScore: number;
}

export type UnifiedMemoryItem = ExplicitMemoryItem | ContextualMemoryItem;

export interface UnifiedMemoryQuery {
  queryText: string;
  timeRange?: {
    start?: string;
    end?: string;
  };
  filterTypes?: MemoryType[];
  targetApplications?: string[];
  limit?: number;
}

export interface GroundedEvidence {
  evidenceType: 'document_page' | 'browser_url' | 'application_window';
  title: string;
  referenceUrl?: string;
  pageNumber?: number | null;
  timestamp?: string;
  verbatimExcerpt: string;
}

export interface UnifiedMemoryAnswer {
  query: string;
  synthesis: string;
  evidence: GroundedEvidence[];
  relatedMemories: UnifiedMemoryItem[];
  confidence: number;
}
