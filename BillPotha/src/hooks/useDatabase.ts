import { useState, useEffect, useCallback } from 'react';
import { Receipt, ParsedReceiptData } from '../types';
import { database } from '../database/database';

interface DatabaseState {
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface DatabaseStats {
  totalReceipts: number;
  totalAmount: number;
  stores: string[];
}

export const useDatabase = () => {
  const [state, setState] = useState<DatabaseState>({
    receipts: [],
    loading: false,
    error: null,
    isInitialized: false,
  });

  const [stats, setStats] = useState<DatabaseStats>({
    totalReceipts: 0,
    totalAmount: 0,
    stores: [],
  });

  // Initialize database on hook mount
  useEffect(() => {
    initializeDB();
  }, []);

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setReceipts = (receipts: Receipt[]) => {
    setState(prev => ({ ...prev, receipts }));
  };

  const setInitialized = (isInitialized: boolean) => {
    setState(prev => ({ ...prev, isInitialized }));
  };

  /**
   * Initialize the database
   */
  const initializeDB = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await database.initialize();
      setInitialized(true);
      
      // Load initial data
      await loadAllReceipts();
      await loadStats();
      
      console.log('Database hook initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Database initialization failed';
      console.error('Database initialization error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load all receipts from database
   */
  const loadAllReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const receipts = await database.getAllReceipts();
      setReceipts(receipts);
      
      console.log(`Loaded ${receipts.length} receipts`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load receipts';
      console.error('Load receipts error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save a new receipt to database
   */
  const saveNewReceipt = useCallback(async (receiptData: ParsedReceiptData): Promise<Receipt | null> => {
    try {
      setLoading(true);
      setError(null);

      // Convert ParsedReceiptData to the format expected by database
      const receiptToSave = {
        storeName: receiptData.storeName || '',
        date: receiptData.date || '',
        totalAmount: receiptData.totalAmount || 0,
        items: receiptData.items || [],
        rawText: '', // We'll need to pass this from the OCR result
      };

      const savedReceipt = await database.saveReceipt(receiptToSave);
      
      // Refresh receipts list
      await loadAllReceipts();
      await loadStats();
      
      console.log('Receipt saved successfully:', savedReceipt.id);
      return savedReceipt;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save receipt';
      console.error('Save receipt error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAllReceipts, loadStats]);

  /**
   * Get a specific receipt by ID
   */
  const getReceipt = useCallback(async (id: string): Promise<Receipt | null> => {
    try {
      setError(null);
      
      const receipt = await database.getReceipt(id);
      return receipt;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get receipt';
      console.error('Get receipt error:', errorMessage);
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Update an existing receipt
   */
  const updateReceiptData = useCallback(async (id: string, updates: Partial<Receipt>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await database.updateReceipt(id, updates);
      
      // Refresh receipts list
      await loadAllReceipts();
      await loadStats();
      
      console.log('Receipt updated successfully:', id);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update receipt';
      console.error('Update receipt error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadAllReceipts, loadStats]);

  /**
   * Delete a receipt
   */
  const deleteReceiptData = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const deleted = await database.deleteReceipt(id);
      
      if (deleted) {
        // Refresh receipts list
        await loadAllReceipts();
        await loadStats();
        console.log('Receipt deleted successfully:', id);
      }
      
      return deleted;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete receipt';
      console.error('Delete receipt error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadAllReceipts, loadStats]);

  /**
   * Get receipts by store
   */
  const getReceiptsByStore = useCallback(async (storeName: string): Promise<Receipt[]> => {
    try {
      setError(null);
      
      const receipts = await database.getReceiptsByStore(storeName);
      return receipts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get receipts by store';
      console.error('Get receipts by store error:', errorMessage);
      setError(errorMessage);
      return [];
    }
  }, []);

  /**
   * Load database statistics
   */
  const loadStats = useCallback(async () => {
    try {
      const dbStats = await database.getStats();
      setStats(dbStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  /**
   * Clear all receipts (for testing)
   */
  const clearAllReceipts = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await database.clearAllReceipts();
      
      // Refresh data
      await loadAllReceipts();
      await loadStats();
      
      console.log('All receipts cleared');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear receipts';
      console.error('Clear receipts error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadAllReceipts, loadStats]);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    await loadAllReceipts();
    await loadStats();
  }, [loadAllReceipts, loadStats]);

  return {
    // State
    receipts: state.receipts,
    loading: state.loading,
    error: state.error,
    isInitialized: state.isInitialized,
    stats,

    // Actions
    initializeDB,
    loadAllReceipts,
    saveNewReceipt,
    getReceipt,
    updateReceiptData,
    deleteReceiptData,
    getReceiptsByStore,
    clearAllReceipts,
    refreshData,
    
    // Utilities
    clearError: () => setError(null),
  };
};