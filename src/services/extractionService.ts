import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Configure PDF.js worker src using official cdnjs build matching installed version
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  fullText: string;
  pages: ExtractedPage[];
  pageCount: number;
}

export const extractionService = {
  /**
   * Extracts text page-by-page from a PDF ArrayBuffer or Blob.
   */
  async extractFromPdf(data: ArrayBuffer | Blob): Promise<ExtractionResult> {
    const arrayBuffer = data instanceof Blob ? await data.arrayBuffer() : data;
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pages: ExtractedPage[] = [];
    const textPieces: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      pages.push({
        pageNumber: pageNum,
        text: pageText,
      });

      if (pageText) {
        textPieces.push(`--- Page ${pageNum} ---\n${pageText}`);
      }
    }

    const fullText = textPieces.join('\n\n').trim();

    return {
      fullText,
      pages,
      pageCount: numPages,
    };
  },

  /**
   * Extracts plain text from a TXT or Markdown file.
   */
  async extractFromTxt(blob: Blob): Promise<ExtractionResult> {
    const text = await blob.text();
    const cleanText = text.trim();

    return {
      fullText: cleanText,
      pages: [{ pageNumber: 1, text: cleanText }],
      pageCount: 1,
    };
  },

  /**
   * Performs lightweight OCR on a PNG / JPG / JPEG screenshot image using Tesseract.js.
   */
  async extractFromImage(blob: Blob): Promise<ExtractionResult> {
    const worker = await createWorker('eng');
    
    try {
      const ret = await worker.recognize(blob);
      const ocrText = ret.data.text.trim();
      
      return {
        fullText: ocrText,
        pages: [{ pageNumber: 1, text: ocrText }],
        pageCount: 1,
      };
    } finally {
      await worker.terminate();
    }
  },

  /**
   * Master extraction dispatcher based on source_type and MIME type.
   */
  async extractContent(
    blob: Blob,
    sourceType: string,
    mimeType?: string | null
  ): Promise<ExtractionResult> {
    const type = sourceType.toLowerCase();
    const mime = (mimeType || '').toLowerCase();

    if (type === 'pdf' || mime.includes('pdf')) {
      return this.extractFromPdf(blob);
    }

    if (
      type === 'image' || 
      type === 'screenshot' || 
      mime.includes('image') || 
      mime.includes('png') || 
      mime.includes('jpeg') || 
      mime.includes('jpg')
    ) {
      return this.extractFromImage(blob);
    }

    // Default to plain text
    return this.extractFromTxt(blob);
  },
};
