import { createWorker, Worker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';

export interface OCRResult {
  extractedText: string;
  confidence: number;
  language: string;
  processingTime: number;
}

export interface ProcessingOptions {
  language?: 'por' | 'eng' | 'spa';
  dpi?: number;
  preserveInterword?: boolean;
  tessedit_char_whitelist?: string;
}

export class OCRProcessor {
  private worker: Worker | null = null;
  private isInitialized = false;

  async initialize(language: 'por' | 'eng' | 'spa' = 'por'): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing OCR worker...');
    const startTime = Date.now();

    try {
      this.worker = await createWorker([language]);
      
      await this.worker.setParameters({
        tessedit_pageseg_mode: 1 as any, // Automatic page segmentation with OSD
        tessedit_ocr_engine_mode: 2 as any, // LSTM only
        preserve_interword_spaces: 1 as any
      });

      this.isInitialized = true;
      console.log(`OCR worker initialized in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      throw new Error('OCR initialization failed');
    }
  }

  async processImage(imageData: string | File | Blob | ArrayBuffer, options: ProcessingOptions = {}): Promise<OCRResult> {
    if (!this.isInitialized || !this.worker) {
      await this.initialize(options.language);
    }

    const startTime = Date.now();
    
    try {
      console.log('Starting OCR processing...');
      
      // Convert different input types to compatible format
      let processableData: string | File | Blob;
      if (imageData instanceof ArrayBuffer) {
        processableData = new Blob([imageData]);
      } else {
        processableData = imageData;
      }
      
      const { data } = await this.worker!.recognize(processableData, {
        rectangle: undefined // Process entire image
      });

      const processingTime = Date.now() - startTime;
      console.log(`OCR completed in ${processingTime}ms`);
      console.log(`Extracted text length: ${data.text.length}`);
      console.log(`Confidence: ${data.confidence}%`);

      return {
        extractedText: data.text,
        confidence: data.confidence,
        language: options.language || 'por',
        processingTime
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('OCR processing failed');
    }
  }

  async processPDF(pdfData: ArrayBuffer, options: ProcessingOptions = {}): Promise<OCRResult> {
    console.log('Processing PDF for OCR...');
    
    try {
      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfData);
      const pages = pdfDoc.getPages();
      
      console.log(`PDF has ${pages.length} pages`);
      
      if (pages.length === 0) {
        throw new Error('PDF has no pages');
      }

      // For now, process only the first page to avoid timeout
      // In production, you might want to process all pages or implement pagination
      const page = pages[0];
      const { width, height } = page.getSize();
      
      console.log(`Page dimensions: ${width}x${height}`);

      // Convert first page to image using canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const scale = options.dpi ? options.dpi / 72 : 2; // Default 144 DPI (2x scale)
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Convert canvas to blob for OCR processing
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to blob conversion failed'));
        }, 'image/png');
      });
      
      // Process with OCR
      return await this.processImage(blob, options);
      
    } catch (error) {
      console.error('PDF processing error:', error);
      
      // Fallback: try to process PDF data directly
      console.log('Attempting direct PDF OCR as fallback...');
      return await this.processImage(pdfData, options);
    }
  }

  async processFile(file: File, options: ProcessingOptions = {}): Promise<OCRResult> {
    console.log(`Processing file: ${file.name} (${file.type})`);
    
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        return await this.processPDF(arrayBuffer, options);
      } else if (file.type.startsWith('image/')) {
        const arrayBuffer = await file.arrayBuffer();
        return await this.processImage(arrayBuffer, options);
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (error) {
      console.error('File processing error:', error);
      throw error;
    }
  }

  detectLanguage(text: string): 'por' | 'eng' | 'spa' {
    const portuguese = /\b(banco|extrato|saldo|débito|crédito|transferência|pix|ted|doc)\b/gi;
    const english = /\b(bank|statement|balance|debit|credit|transfer|payment|check)\b/gi;
    const spanish = /\b(banco|extracto|saldo|débito|crédito|transferencia|pago|bizum)\b/gi;

    const ptMatches = (text.match(portuguese) || []).length;
    const enMatches = (text.match(english) || []).length;
    const esMatches = (text.match(spanish) || []).length;

    if (ptMatches >= enMatches && ptMatches >= esMatches) return 'por';
    if (esMatches >= enMatches) return 'spa';
    return 'eng';
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      console.log('Terminating OCR worker...');
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  // Static method for one-off processing
  static async quickProcess(file: File, language?: 'por' | 'eng' | 'spa'): Promise<OCRResult> {
    const processor = new OCRProcessor();
    
    try {
      const result = await processor.processFile(file, { language });
      await processor.cleanup();
      return result;
    } catch (error) {
      await processor.cleanup();
      throw error;
    }
  }
}

export const ocrProcessor = new OCRProcessor();