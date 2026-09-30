export interface RawChunk {
  chunk_index: number;
  page_number: number | null;
  raw_text: string;
  token_count: number;
}

export interface ChunkingOptions {
  maxChunkChars?: number; // default ~1500 chars (~350-400 tokens)
  overlapChars?: number;  // default ~200 chars (~50 tokens)
}

/**
 * Estimates token count from raw text string.
 * Rule of thumb: 1 token is ~4 chars or 0.75 words for English text.
 */
export function estimateTokenCount(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
}

/**
 * Splits text into overlapping chunks respecting sentence/paragraph boundaries where possible.
 */
export function chunkText(
  text: string,
  pageNumber: number | null = null,
  startIndex = 0,
  options: ChunkingOptions = {}
): RawChunk[] {
  const maxChars = options.maxChunkChars || 1500;
  const overlap = options.overlapChars || 200;
  const chunks: RawChunk[] = [];

  const cleanText = text.replace(/\r\n/g, '\n').trim();
  if (!cleanText) return [];

  // If text is smaller than max chunk size, return single chunk
  if (cleanText.length <= maxChars) {
    return [
      {
        chunk_index: startIndex,
        page_number: pageNumber,
        raw_text: cleanText,
        token_count: estimateTokenCount(cleanText),
      },
    ];
  }

  // Split by paragraphs first
  const paragraphs = cleanText.split(/\n\s*\n/);
  let currentChunk = '';
  let currentIndex = startIndex;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (currentChunk.length + trimmedPara.length + 2 <= maxChars) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
    } else {
      if (currentChunk) {
        chunks.push({
          chunk_index: currentIndex++,
          page_number: pageNumber,
          raw_text: currentChunk,
          token_count: estimateTokenCount(currentChunk),
        });

        // Retain overlap from end of current chunk
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText ? `${overlapText}\n\n${trimmedPara}` : trimmedPara;
      } else {
        // Single paragraph exceeds maxChars: split by sentences or hard window
        const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s|$)/g) || [trimmedPara];
        let subChunk = '';

        for (const sentence of sentences) {
          if (subChunk.length + sentence.length <= maxChars) {
            subChunk += sentence;
          } else {
            if (subChunk) {
              chunks.push({
                chunk_index: currentIndex++,
                page_number: pageNumber,
                raw_text: subChunk.trim(),
                token_count: estimateTokenCount(subChunk),
              });
              const subOverlap = subChunk.slice(-overlap);
              subChunk = subOverlap + sentence;
            } else {
              // Hard split if a single sentence is excessively long
              for (let i = 0; i < sentence.length; i += (maxChars - overlap)) {
                const slice = sentence.slice(i, i + maxChars);
                chunks.push({
                  chunk_index: currentIndex++,
                  page_number: pageNumber,
                  raw_text: slice.trim(),
                  token_count: estimateTokenCount(slice),
                });
              }
              subChunk = '';
            }
          }
        }

        if (subChunk.trim()) {
          currentChunk = subChunk.trim();
        }
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      chunk_index: currentIndex++,
      page_number: pageNumber,
      raw_text: currentChunk.trim(),
      token_count: estimateTokenCount(currentChunk),
    });
  }

  return chunks;
}
