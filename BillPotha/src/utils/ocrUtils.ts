import { OCRFrame } from 'vision-camera-ocr';

export interface OCRProcessingResult {
  text: string;
  confidence?: number;
  error?: string;
}

/**
 * Safely process OCR frame with error handling
 */
export const processOCRFrame = (frame: any): OCRProcessingResult => {
  try {
    if (!frame || !frame.result) {
      return { text: '', error: 'Invalid frame data' };
    }

    const text = frame.result.text || '';
    const confidence = frame.result.confidence || 0;

    return {
      text: text.trim(),
      confidence,
    };
  } catch (error) {
    console.warn('OCR Processing Error:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Unknown OCR error',
    };
  }
};

/**
 * Check if OCR text has minimum quality for processing
 */
export const isOCRTextValid = (text: string, minLength: number = 20): boolean => {
  if (!text || text.length < minLength) {
    return false;
  }

  // Check if text contains mostly readable characters
  const readableChars = text.match(/[a-zA-Z0-9\s.,]/g) || [];
  const readableRatio = readableChars.length / text.length;

  return readableRatio > 0.5; // At least 50% readable characters
};

/**
 * Clean and normalize OCR text
 */
export const cleanOCRText = (text: string): string => {
  return text
    .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, '') // Remove non-printable chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

/**
 * Throttle function to prevent excessive processing
 */
export const createThrottle = (func: Function, delay: number) => {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: any[]) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, delay - (now - lastCall));
    }
  };
};