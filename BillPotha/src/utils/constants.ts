// Constants for Bill Potha App

export const APP_NAME = 'Bill Potha';

export const COLORS = {
  primary: '#2E7D32', // Green - representing Sri Lankan flag
  secondary: '#FF5722', // Orange/Red - representing Sri Lankan flag  
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const CURRENCY = {
  symbol: 'Rs.',
  code: 'LKR',
};

// OCR Configuration
export const OCR_CONFIG = {
  confidence_threshold: 0.7,
  max_retry_attempts: 3,
  processing_timeout: 30000, // 30 seconds
};

// Database Configuration
export const DB_CONFIG = {
  name: 'billpotha.db',
  version: 1,
  table_names: {
    receipts: 'receipts',
    receipt_items: 'receipt_items',
  },
};

// Common Sri Lankan store patterns for better parsing
export const SRI_LANKA_STORES = [
  'Cargills',
  'Keells',
  'Arpico',
  'Laugfs',
  'Sathosa',
  'Food City',
  'Crescat',
  'Odel',
  'House of Fashion',
  'Singer',
  'Softlogic',
];

// Common receipt patterns in Sinhala and Tamil
export const RECEIPT_PATTERNS = {
  total_keywords: ['Total', 'TOTAL', 'Grand Total', 'GRAND TOTAL', 'සම්පූර්ණ', 'மொத்தம்'],
  date_patterns: [
    /\d{1,2}\/\d{1,2}\/\d{4}/, // DD/MM/YYYY
    /\d{1,2}-\d{1,2}-\d{4}/, // DD-MM-YYYY
    /\d{4}-\d{1,2}-\d{1,2}/, // YYYY-MM-DD
  ],
  price_patterns: [
    /Rs\.?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/, // Rs. 1,000.00
    /LKR\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/, // LKR 1,000.00
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\/=/, // 1,000.00 /=
  ],
};

export const SCREEN_NAMES = {
  HOME: 'Home',
  SCANNER: 'Scanner',
  RECEIPT_DETAIL: 'ReceiptDetail',
  RECEIPTS_LIST: 'ReceiptsList',
} as const;