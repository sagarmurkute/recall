import { supabase } from '../lib/supabase';
import { extractionService } from './extractionService';
import { chunkText, type RawChunk } from './chunkingService';
import { documentsService } from './documentsService';
import { sourcesService } from './sourcesService';
import type { Source, DocumentChunkInsert, DocumentInsert } from '../types';

export interface ProcessingResult {
  success: boolean;
  documentId?: string;
  chunkCount?: number;
  pageCount?: number;
  error?: string;
}

export const processingPipeline = {
  /**
   * Executes the full extraction and chunking pipeline for a given source:
   * uploaded -> processing -> extract text -> create chunks -> ready (or failed)
   */
  async processSource(source: Source, userId: string): Promise<ProcessingResult> {
    if (!source.storage_path) {
      const err = 'Source does not contain a valid storage_path';
      await this.markSourceFailed(source, err);
      return { success: false, error: err };
    }

    try {
      // Step 1: Mark source status as 'processing'
      const currentMeta = (source.metadata as Record<string, unknown>) || {};
      await sourcesService.updateSource(source.id, {
        metadata: {
          ...currentMeta,
          status: 'processing',
          processing_started_at: new Date().toISOString(),
        },
      });

      // Step 2: Download the private file binary from Supabase Storage
      const { data: blob, error: downloadError } = await supabase.storage
        .from(source.storage_bucket || 'user_files')
        .download(source.storage_path);

      if (downloadError || !blob) {
        throw new Error(`Failed to download storage file: ${downloadError?.message || 'Empty file payload'}`);
      }

      // Step 3: Extract text based on file type (PDF, TXT, OCR Image)
      const extraction = await extractionService.extractContent(
        blob,
        source.source_type,
        source.mime_type
      );

      if (!extraction.fullText && extraction.pages.length === 0) {
        throw new Error('No readable text could be extracted from this file.');
      }

      // Step 4: Create or retrieve Document entity
      const { data: existingDocs } = await documentsService.getDocuments(source.id);
      let documentId: string;

      const summaryPreview = extraction.fullText.slice(0, 250).replace(/\s+/g, ' ').trim() + 
        (extraction.fullText.length > 250 ? '...' : '');

      if (existingDocs && existingDocs.length > 0) {
        documentId = existingDocs[0].id;
        await documentsService.updateDocument(documentId, {
          title: source.title,
          summary: summaryPreview || 'Extracted document content',
          page_count: extraction.pageCount,
        });

        // Delete old chunks before re-inserting
        await supabase
          .from('document_chunks')
          .delete()
          .eq('document_id', documentId);
      } else {
        const newDoc: DocumentInsert = {
          user_id: userId,
          source_id: source.id,
          title: source.title,
          summary: summaryPreview || 'Extracted document content',
          page_count: extraction.pageCount,
          is_pinned: false,
        };

        const { data: createdDoc, error: docError } = await documentsService.createDocument(newDoc);
        if (docError || !createdDoc) {
          throw new Error(`Failed to create document record: ${docError?.message}`);
        }
        documentId = createdDoc.id;
      }

      // Step 5: Generate Chunks preserving page numbers
      const rawChunks: RawChunk[] = [];
      let globalChunkIndex = 0;

      if (extraction.pages.length > 1) {
        // Multi-page PDF: chunk page by page
        for (const page of extraction.pages) {
          if (!page.text.trim()) continue;
          const pageChunks = chunkText(page.text, page.pageNumber, globalChunkIndex, {
            maxChunkChars: 1200,
            overlapChars: 150,
          });
          rawChunks.push(...pageChunks);
          globalChunkIndex += pageChunks.length;
        }
      } else {
        // Single page document, image, or raw TXT
        const chunks = chunkText(extraction.fullText, 1, 0, {
          maxChunkChars: 1200,
          overlapChars: 150,
        });
        rawChunks.push(...chunks);
      }

      // If document was empty or whitespace only, fallback to a single placeholder chunk
      if (rawChunks.length === 0 && extraction.fullText.trim()) {
        rawChunks.push({
          chunk_index: 0,
          page_number: 1,
          raw_text: extraction.fullText.trim(),
          token_count: Math.ceil(extraction.fullText.trim().split(/\s+/).length * 1.3),
        });
      }

      // Step 6: Insert Chunks into Supabase `document_chunks`
      const chunksToInsert: DocumentChunkInsert[] = rawChunks.map((c) => ({
        user_id: userId,
        document_id: documentId,
        chunk_index: c.chunk_index,
        page_number: c.page_number,
        raw_text: c.raw_text,
        token_count: c.token_count,
        extracted_entities: {},
      }));

      if (chunksToInsert.length > 0) {
        const { error: chunkInsertError } = await documentsService.insertDocumentChunks(chunksToInsert);
        if (chunkInsertError) {
          throw new Error(`Failed to save document chunks: ${chunkInsertError.message}`);
        }
      }

      // Step 7: Mark source status as 'ready'
      await sourcesService.updateSource(source.id, {
        metadata: {
          ...currentMeta,
          status: 'ready',
          document_id: documentId,
          page_count: extraction.pageCount,
          chunk_count: chunksToInsert.length,
          total_characters: extraction.fullText.length,
          extracted_at: new Date().toISOString(),
          error_message: null,
        },
      });

      return {
        success: true,
        documentId,
        chunkCount: chunksToInsert.length,
        pageCount: extraction.pageCount,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown extraction failure';
      console.error(`[Recall] Processing failed for source ${source.id}:`, err);
      await this.markSourceFailed(source, errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  async markSourceFailed(source: Source, errorMessage: string) {
    const currentMeta = (source.metadata as Record<string, unknown>) || {};
    try {
      await sourcesService.updateSource(source.id, {
        metadata: {
          ...currentMeta,
          status: 'failed',
          error_message: errorMessage,
          failed_at: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error('[Recall] Could not update failed status in database:', e);
    }
  },
};
