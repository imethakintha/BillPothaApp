import * as SQLite from 'expo-sqlite';
import { Receipt, ParsedReceiptData, DatabaseService } from '../types';
import { DB_CONFIG } from '../utils/constants';

/**
 * SQLite Database Service for Bill Potha Receipt Storage
 */
class BillPothaDatabase implements DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  /**
   * Initialize the database connection and create tables
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Bill Potha Database...');
      
      // Open or create the database
      this.db = await SQLite.openDatabaseAsync(DB_CONFIG.name);
      
      // Enable foreign keys
      await this.db.execAsync('PRAGMA foreign_keys = ON;');
      
      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error(`Failed to initialize database: ${error}`);
    }
  }

  /**
   * Create the receipts table if it doesn't exist
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createReceiptsTable = `
      CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_name TEXT,
        purchase_date TEXT,
        total_amount REAL,
        items_json TEXT NOT NULL,
        raw_text TEXT,
        confidence REAL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(purchase_date);
      CREATE INDEX IF NOT EXISTS idx_receipts_created ON receipts(created_at);
      CREATE INDEX IF NOT EXISTS idx_receipts_store ON receipts(store_name);
    `;

    try {
      await this.db.execAsync(createReceiptsTable);
      await this.db.execAsync(createIndexes);
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Failed to create tables:', error);
      throw error;
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }
  }

  /**
   * Save a new receipt to the database
   */
  async saveReceipt(receiptData: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Receipt> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    const now = new Date().toISOString();

    try {
      console.log('Saving receipt to database:', receiptData);

      const result = await this.db.runAsync(
        `INSERT INTO receipts (
          store_name, 
          purchase_date, 
          total_amount, 
          items_json, 
          raw_text,
          confidence,
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          receiptData.storeName || '',
          receiptData.date || '',
          receiptData.totalAmount || 0,
          JSON.stringify(receiptData.items),
          receiptData.rawText || '',
          0.8, // Default confidence if not provided
          now,
          now
        ]
      );

      const savedReceipt: Receipt = {
        id: result.lastInsertRowId.toString(),
        storeName: receiptData.storeName,
        date: receiptData.date,
        items: receiptData.items,
        totalAmount: receiptData.totalAmount,
        rawText: receiptData.rawText,
        createdAt: now,
        updatedAt: now,
      };

      console.log('Receipt saved successfully with ID:', savedReceipt.id);
      return savedReceipt;
    } catch (error) {
      console.error('Failed to save receipt:', error);
      throw new Error(`Failed to save receipt: ${error}`);
    }
  }

  /**
   * Get all receipts, ordered by creation date (newest first)
   */
  async getAllReceipts(): Promise<Receipt[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      console.log('Fetching all receipts from database...');

      const rows = await this.db.getAllAsync(
        `SELECT 
          id,
          store_name,
          purchase_date,
          total_amount,
          items_json,
          raw_text,
          confidence,
          created_at,
          updated_at
        FROM receipts 
        ORDER BY created_at DESC`
      );

      const receipts: Receipt[] = rows.map((row: any) => ({
        id: row.id.toString(),
        storeName: row.store_name || '',
        date: row.purchase_date || '',
        totalAmount: row.total_amount || 0,
        items: this.parseItemsJson(row.items_json),
        rawText: row.raw_text || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      console.log(`Retrieved ${receipts.length} receipts from database`);
      return receipts;
    } catch (error) {
      console.error('Failed to get all receipts:', error);
      throw new Error(`Failed to retrieve receipts: ${error}`);
    }
  }

  /**
   * Get a single receipt by ID
   */
  async getReceipt(id: string): Promise<Receipt | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      console.log('Fetching receipt by ID:', id);

      const row = await this.db.getFirstAsync(
        `SELECT 
          id,
          store_name,
          purchase_date,
          total_amount,
          items_json,
          raw_text,
          confidence,
          created_at,
          updated_at
        FROM receipts 
        WHERE id = ?`,
        [id]
      );

      if (!row) {
        console.log('Receipt not found with ID:', id);
        return null;
      }

      const receipt: Receipt = {
        id: row.id.toString(),
        storeName: row.store_name || '',
        date: row.purchase_date || '',
        totalAmount: row.total_amount || 0,
        items: this.parseItemsJson(row.items_json),
        rawText: row.raw_text || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      console.log('Receipt retrieved successfully:', receipt.id);
      return receipt;
    } catch (error) {
      console.error('Failed to get receipt by ID:', error);
      throw new Error(`Failed to retrieve receipt: ${error}`);
    }
  }

  /**
   * Update an existing receipt
   */
  async updateReceipt(id: string, updates: Partial<Receipt>): Promise<Receipt> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      console.log('Updating receipt:', id, updates);

      const now = new Date().toISOString();

      await this.db.runAsync(
        `UPDATE receipts SET 
          store_name = COALESCE(?, store_name),
          purchase_date = COALESCE(?, purchase_date),
          total_amount = COALESCE(?, total_amount),
          items_json = COALESCE(?, items_json),
          raw_text = COALESCE(?, raw_text),
          updated_at = ?
        WHERE id = ?`,
        [
          updates.storeName,
          updates.date,
          updates.totalAmount,
          updates.items ? JSON.stringify(updates.items) : null,
          updates.rawText,
          now,
          id
        ]
      );

      const updatedReceipt = await this.getReceipt(id);
      if (!updatedReceipt) {
        throw new Error('Receipt not found after update');
      }

      console.log('Receipt updated successfully');
      return updatedReceipt;
    } catch (error) {
      console.error('Failed to update receipt:', error);
      throw new Error(`Failed to update receipt: ${error}`);
    }
  }

  /**
   * Delete a receipt by ID
   */
  async deleteReceipt(id: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      console.log('Deleting receipt:', id);

      const result = await this.db.runAsync(
        'DELETE FROM receipts WHERE id = ?',
        [id]
      );

      const deleted = result.changes > 0;
      console.log('Receipt deletion result:', deleted);
      return deleted;
    } catch (error) {
      console.error('Failed to delete receipt:', error);
      throw new Error(`Failed to delete receipt: ${error}`);
    }
  }

  /**
   * Get receipts by store name
   */
  async getReceiptsByStore(storeName: string): Promise<Receipt[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      console.log('Fetching receipts by store:', storeName);

      const rows = await this.db.getAllAsync(
        `SELECT 
          id,
          store_name,
          purchase_date,
          total_amount,
          items_json,
          raw_text,
          confidence,
          created_at,
          updated_at
        FROM receipts 
        WHERE store_name = ?
        ORDER BY created_at DESC`,
        [storeName]
      );

      const receipts: Receipt[] = rows.map((row: any) => ({
        id: row.id.toString(),
        storeName: row.store_name || '',
        date: row.purchase_date || '',
        totalAmount: row.total_amount || 0,
        items: this.parseItemsJson(row.items_json),
        rawText: row.raw_text || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      console.log(`Retrieved ${receipts.length} receipts for store: ${storeName}`);
      return receipts;
    } catch (error) {
      console.error('Failed to get receipts by store:', error);
      throw new Error(`Failed to retrieve receipts by store: ${error}`);
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{ totalReceipts: number; totalAmount: number; stores: string[] }> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      const totalReceipts = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM receipts'
      );

      const totalAmount = await this.db.getFirstAsync(
        'SELECT SUM(total_amount) as sum FROM receipts'
      );

      const stores = await this.db.getAllAsync(
        'SELECT DISTINCT store_name FROM receipts WHERE store_name IS NOT NULL AND store_name != ""'
      );

      return {
        totalReceipts: totalReceipts?.count || 0,
        totalAmount: totalAmount?.sum || 0,
        stores: stores.map((row: any) => row.store_name),
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw new Error(`Failed to get database stats: ${error}`);
    }
  }

  /**
   * Clear all receipts (for testing/debugging)
   */
  async clearAllReceipts(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not available');

    try {
      console.log('Clearing all receipts from database...');
      await this.db.runAsync('DELETE FROM receipts');
      console.log('All receipts cleared successfully');
    } catch (error) {
      console.error('Failed to clear receipts:', error);
      throw new Error(`Failed to clear receipts: ${error}`);
    }
  }

  /**
   * Helper method to safely parse items JSON
   */
  private parseItemsJson(itemsJson: any): any[] {
    try {
      if (typeof itemsJson === 'string') {
        return JSON.parse(itemsJson);
      }
      return itemsJson || [];
    } catch (error) {
      console.warn('Failed to parse items JSON:', error);
      return [];
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      console.log('Database connection closed');
    }
  }
}

// Export singleton instance
export const database = new BillPothaDatabase();

// Export utility functions for direct usage
export const initializeDatabase = () => database.initialize();
export const saveReceipt = (receiptData: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>) => 
  database.saveReceipt(receiptData);
export const getAllReceipts = () => database.getAllReceipts();
export const getReceiptById = (id: string) => database.getReceipt(id);
export const updateReceipt = (id: string, updates: Partial<Receipt>) => 
  database.updateReceipt(id, updates);
export const deleteReceipt = (id: string) => database.deleteReceipt(id);
export const getReceiptsByStore = (storeName: string) => database.getReceiptsByStore(storeName);
export const getDatabaseStats = () => database.getStats();
export const clearAllReceipts = () => database.clearAllReceipts();

export default database;