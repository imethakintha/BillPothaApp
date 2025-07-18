// Core types for Bill Potha Receipt Scanner App

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

export interface Receipt {
  id: string;
  storeName: string;
  date: string;
  items: ReceiptItem[];
  totalAmount: number;
  rawText: string; // Original OCR text
  createdAt: string;
  updatedAt: string;
}

export interface OCRResult {
  text: string;
  confidence?: number;
  blocks?: TextBlock[];
}

export interface TextBlock {
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ParsedReceiptData {
  storeName?: string;
  date?: string;
  items: ReceiptItem[];
  totalAmount?: number;
  confidence: number;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Scanner: undefined;
  ReceiptDetail: {
    receiptId: string;
  };
  ReceiptsList: undefined;
};

// Database operations
export interface DatabaseService {
  saveReceipt: (receipt: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Receipt>;
  getReceipt: (id: string) => Promise<Receipt | null>;
  getAllReceipts: () => Promise<Receipt[]>;
  updateReceipt: (id: string, updates: Partial<Receipt>) => Promise<Receipt>;
  deleteReceipt: (id: string) => Promise<boolean>;
}

// OCR Service
export interface OCRService {
  scanImage: (imagePath: string) => Promise<OCRResult>;
  parseReceiptText: (text: string) => Promise<ParsedReceiptData>;
}