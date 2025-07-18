import { ParsedReceiptData, ReceiptItem } from '../types';
import { SRI_LANKA_STORES, RECEIPT_PATTERNS, CURRENCY } from '../utils/constants';

export class ReceiptParserService {
  
  /**
   * Enhanced receipt text parsing with multiple strategies
   */
  static parseReceiptText(text: string): ParsedReceiptData {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    return {
      storeName: this.extractStoreName(lines),
      date: this.extractDate(lines),
      items: this.extractItems(lines),
      totalAmount: this.extractTotalAmount(lines),
      confidence: 0, // Will be calculated at the end
    };
  }
  
  /**
   * Extract store name with fuzzy matching
   */
  private static extractStoreName(lines: string[]): string {
    // Check first 6 lines for store names
    const headerLines = lines.slice(0, 6);
    
    for (const line of headerLines) {
      const upperLine = line.toUpperCase();
      
      // Exact matches first
      for (const store of SRI_LANKA_STORES) {
        if (upperLine.includes(store.toUpperCase())) {
          return store;
        }
      }
      
      // Fuzzy matching for partial store names
      for (const store of SRI_LANKA_STORES) {
        const storeWords = store.split(' ');
        const matchedWords = storeWords.filter(word => 
          upperLine.includes(word.toUpperCase())
        );
        
        // If more than half the words match, consider it a match
        if (matchedWords.length > storeWords.length / 2) {
          return store;
        }
      }
    }
    
    return '';
  }
  
  /**
   * Extract purchase date with multiple format support
   */
  private static extractDate(lines: string[]): string {
    for (const line of lines) {
      for (const pattern of RECEIPT_PATTERNS.date_patterns) {
        const match = line.match(pattern);
        if (match) {
          return this.normalizeDate(match[0]);
        }
      }
      
      // Additional date patterns specific to Sri Lankan receipts
      const additionalPatterns = [
        /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/, // DD / MM / YYYY with spaces
        /(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(\d{4})/, // DD - MM - YYYY with spaces
        /(\d{4})\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})/, // YYYY / MM / DD
      ];
      
      for (const pattern of additionalPatterns) {
        const match = line.match(pattern);
        if (match) {
          return this.normalizeDate(match[0]);
        }
      }
    }
    
    return '';
  }
  
  /**
   * Normalize date format to DD-MM-YYYY
   */
  private static normalizeDate(dateStr: string): string {
    // Remove extra spaces
    const cleaned = dateStr.replace(/\s+/g, '');
    
    // Handle different separators
    const separators = ['/', '-', '.'];
    for (const sep of separators) {
      if (cleaned.includes(sep)) {
        const parts = cleaned.split(sep);
        if (parts.length === 3) {
          // Determine if it's DD-MM-YYYY or YYYY-MM-DD
          if (parts[0].length === 4) {
            // YYYY-MM-DD format
            return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
          } else {
            // DD-MM-YYYY format
            return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
          }
        }
      }
    }
    
    return cleaned;
  }
  
  /**
   * Extract total amount with sophisticated price detection
   */
  private static extractTotalAmount(lines: string[]): number {
    let highestAmount = 0;
    const foundAmounts: number[] = [];
    
    for (const line of lines) {
      const upperLine = line.toUpperCase();
      
      // Look for total keywords
      const hasTotal = RECEIPT_PATTERNS.total_keywords.some(keyword => 
        upperLine.includes(keyword.toUpperCase())
      );
      
      if (hasTotal) {
        const amounts = this.extractPricesFromLine(line);
        foundAmounts.push(...amounts);
      }
    }
    
    // If we found amounts near "total" keywords, use the highest
    if (foundAmounts.length > 0) {
      return Math.max(...foundAmounts);
    }
    
    // Fallback: look for the highest amount in the entire receipt
    for (const line of lines) {
      const amounts = this.extractPricesFromLine(line);
      for (const amount of amounts) {
        if (amount > highestAmount) {
          highestAmount = amount;
        }
      }
    }
    
    return highestAmount;
  }
  
  /**
   * Extract all price values from a line
   */
  private static extractPricesFromLine(line: string): number[] {
    const prices: number[] = [];
    
    for (const pattern of RECEIPT_PATTERNS.price_patterns) {
      const matches = line.matchAll(new RegExp(pattern.source, 'g'));
      for (const match of matches) {
        const priceStr = match[1] || match[0];
        const cleanPrice = priceStr.replace(/,/g, '').replace(/[^\d.]/g, '');
        const price = parseFloat(cleanPrice);
        
        if (!isNaN(price) && price > 0) {
          prices.push(price);
        }
      }
    }
    
    return prices;
  }
  
  /**
   * Extract individual items with enhanced logic
   */
  private static extractItems(lines: string[]): ReceiptItem[] {
    const items: ReceiptItem[] = [];
    const usedLines = new Set<number>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip if line already used or contains total keywords
      if (usedLines.has(i) || this.containsTotalKeyword(line)) {
        continue;
      }
      
      const itemData = this.parseItemLine(line, i);
      if (itemData) {
        items.push(itemData);
        usedLines.add(i);
      }
    }
    
    // Post-process to remove duplicate items
    return this.removeDuplicateItems(items);
  }
  
  /**
   * Check if line contains total-related keywords
   */
  private static containsTotalKeyword(line: string): boolean {
    const upperLine = line.toUpperCase();
    return RECEIPT_PATTERNS.total_keywords.some(keyword => 
      upperLine.includes(keyword.toUpperCase())
    );
  }
  
  /**
   * Parse a single line to extract item information
   */
  private static parseItemLine(line: string, lineIndex: number): ReceiptItem | null {
    const prices = this.extractPricesFromLine(line);
    
    if (prices.length === 0) return null;
    
    // Use the first price found (usually the item price)
    const price = prices[0];
    
    // Extract item name by removing price and cleaning up
    let itemName = line;
    
    // Remove all price patterns from the line
    for (const pattern of RECEIPT_PATTERNS.price_patterns) {
      itemName = itemName.replace(pattern, '');
    }
    
    // Clean up the item name
    itemName = itemName
      .replace(/\.{2,}/g, '') // Remove multiple dots
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^\W+|\W+$/g, '') // Remove leading/trailing non-word chars
      .trim();
    
    // Validation: item name should be reasonable
    if (itemName.length < 2 || itemName.length > 100) {
      return null;
    }
    
    // Skip if it's likely not an item (too short, all numbers, etc.)
    if (/^\d+$/.test(itemName) || itemName.length < 3) {
      return null;
    }
    
    return {
      id: `item_${Date.now()}_${lineIndex}_${Math.random()}`,
      name: itemName,
      price: price,
      quantity: this.extractQuantity(line),
    };
  }
  
  /**
   * Extract quantity from line (basic implementation)
   */
  private static extractQuantity(line: string): number {
    // Look for patterns like "2x", "3 x", "Qty: 2", etc.
    const quantityPatterns = [
      /(\d+)\s*x\s*\w/i,
      /qty\s*:?\s*(\d+)/i,
      /quantity\s*:?\s*(\d+)/i,
      /^(\d+)\s+\w/,
    ];
    
    for (const pattern of quantityPatterns) {
      const match = line.match(pattern);
      if (match) {
        const qty = parseInt(match[1]);
        if (!isNaN(qty) && qty > 0 && qty <= 99) {
          return qty;
        }
      }
    }
    
    return 1; // Default quantity
  }
  
  /**
   * Remove duplicate items based on name similarity
   */
  private static removeDuplicateItems(items: ReceiptItem[]): ReceiptItem[] {
    const uniqueItems: ReceiptItem[] = [];
    
    for (const item of items) {
      const isDuplicate = uniqueItems.some(existing => 
        this.areSimilarItems(existing.name, item.name)
      );
      
      if (!isDuplicate) {
        uniqueItems.push(item);
      }
    }
    
    return uniqueItems;
  }
  
  /**
   * Check if two item names are similar (basic similarity check)
   */
  private static areSimilarItems(name1: string, name2: string): boolean {
    const clean1 = name1.toLowerCase().replace(/[^\w\s]/g, '');
    const clean2 = name2.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Exact match
    if (clean1 === clean2) return true;
    
    // Check if one is contained in the other
    if (clean1.includes(clean2) || clean2.includes(clean1)) {
      return true;
    }
    
    // Check word overlap
    const words1 = clean1.split(/\s+/);
    const words2 = clean2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    // If more than 70% of words are common, consider similar
    return commonWords.length > Math.min(words1.length, words2.length) * 0.7;
  }
  
  /**
   * Calculate confidence score for parsed data
   */
  static calculateConfidence(data: ParsedReceiptData): number {
    let score = 0;
    
    // Store name confidence
    if (data.storeName) {
      score += 0.25;
      // Bonus for exact store match
      if (SRI_LANKA_STORES.includes(data.storeName)) {
        score += 0.1;
      }
    }
    
    // Date confidence
    if (data.date) {
      score += 0.2;
      // Bonus for proper date format
      if (/^\d{2}-\d{2}-\d{4}$/.test(data.date)) {
        score += 0.05;
      }
    }
    
    // Total amount confidence
    if (data.totalAmount && data.totalAmount > 0) {
      score += 0.25;
      // Bonus for reasonable amount
      if (data.totalAmount >= 10 && data.totalAmount <= 100000) {
        score += 0.05;
      }
    }
    
    // Items confidence
    if (data.items && data.items.length > 0) {
      score += 0.2;
      // Bonus for multiple items
      if (data.items.length > 1) {
        score += 0.05;
      }
      // Bonus for reasonable item prices
      const reasonableItems = data.items.filter(item => 
        item.price >= 1 && item.price <= data.totalAmount
      );
      if (reasonableItems.length === data.items.length) {
        score += 0.05;
      }
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }
}