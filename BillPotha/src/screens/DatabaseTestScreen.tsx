import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { ReceiptScanner } from '../components/ReceiptScanner';
import { ParsedReceiptData, Receipt } from '../types';
import { COLORS, SPACING, CURRENCY } from '../utils/constants';
import { useDatabase } from '../hooks/useDatabase';

export const DatabaseTestScreen: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const {
    receipts,
    loading,
    error,
    isInitialized,
    stats,
    saveNewReceipt,
    deleteReceiptData,
    clearAllReceipts,
    refreshData,
    clearError,
  } = useDatabase();

  const handleReceiptScanned = async (data: ParsedReceiptData) => {
    console.log('Receipt scanned:', data);
    setShowScanner(false);
    
    // Save to database
    const savedReceipt = await saveNewReceipt(data);
    
    if (savedReceipt) {
      Alert.alert(
        'Receipt Saved!',
        `Successfully saved receipt from ${data.storeName || 'Unknown Store'}\nTotal: ${CURRENCY.symbol}${data.totalAmount}\nDatabase ID: ${savedReceipt.id}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Save Failed',
        'Failed to save receipt to database. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleScannerClose = () => {
    setShowScanner(false);
  };

  const startScanning = () => {
    if (!isInitialized) {
      Alert.alert('Database Not Ready', 'Please wait for database to initialize');
      return;
    }
    setShowScanner(true);
  };

  const viewReceiptDetails = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
  };

  const deleteReceipt = (receipt: Receipt) => {
    Alert.alert(
      'Delete Receipt',
      `Are you sure you want to delete the receipt from ${receipt.storeName || 'Unknown Store'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const deleted = await deleteReceiptData(receipt.id);
            if (deleted) {
              Alert.alert('Success', 'Receipt deleted successfully');
            } else {
              Alert.alert('Error', 'Failed to delete receipt');
            }
          },
        },
      ]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Receipts',
      'This will permanently delete all saved receipts. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const cleared = await clearAllReceipts();
            if (cleared) {
              Alert.alert('Success', 'All receipts cleared successfully');
            } else {
              Alert.alert('Error', 'Failed to clear receipts');
            }
          },
        },
      ]
    );
  };

  const addTestReceipt = async () => {
    const testReceipt: ParsedReceiptData = {
      storeName: 'Keells',
      date: new Date().toLocaleDateString('en-GB'),
      totalAmount: 1250.50,
      items: [
        { id: 'test1', name: 'Milk Powder 400g', price: 550.00, quantity: 1 },
        { id: 'test2', name: 'Bread', price: 200.50, quantity: 2 },
        { id: 'test3', name: 'Rice 5kg', price: 500.00, quantity: 1 },
      ],
      confidence: 0.95,
    };

    const saved = await saveNewReceipt(testReceipt);
    if (saved) {
      Alert.alert('Test Receipt Added', 'Sample receipt saved to database');
    }
  };

  if (showScanner) {
    return (
      <ReceiptScanner
        onReceiptScanned={handleReceiptScanned}
        onClose={handleScannerClose}
      />
    );
  }

  if (selectedReceipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setSelectedReceipt(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt Details</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.receiptCard}>
            <Text style={styles.receiptStore}>{selectedReceipt.storeName || 'Unknown Store'}</Text>
            <Text style={styles.receiptDate}>Date: {selectedReceipt.date || 'Unknown'}</Text>
            <Text style={styles.receiptTotal}>
              Total: {CURRENCY.symbol}{selectedReceipt.totalAmount.toFixed(2)}
            </Text>
            <Text style={styles.receiptId}>ID: {selectedReceipt.id}</Text>
          </View>

          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Items ({selectedReceipt.items.length})</Text>
            {selectedReceipt.items.map((item, index) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                  {item.quantity > 1 && `${item.quantity}x `}
                  {CURRENCY.symbol}{item.price.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.metaSection}>
            <Text style={styles.sectionTitle}>Metadata</Text>
            <Text style={styles.metaText}>Created: {new Date(selectedReceipt.createdAt).toLocaleString()}</Text>
            <Text style={styles.metaText}>Updated: {new Date(selectedReceipt.updatedAt).toLocaleString()}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bill Potha Database</Text>
        <Text style={styles.subtitle}>Receipt Storage & Management</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={clearError}>
            <Text style={styles.errorButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Database Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalReceipts}</Text>
            <Text style={styles.statLabel}>Total Receipts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{CURRENCY.symbol}{stats.totalAmount.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Amount</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.stores.length}</Text>
            <Text style={styles.statLabel}>Unique Stores</Text>
          </View>
        </View>
        {stats.stores.length > 0 && (
          <Text style={styles.storesList}>
            Stores: {stats.stores.join(', ')}
          </Text>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]} 
          onPress={startScanning}
          disabled={!isInitialized || loading}
        >
          <Text style={styles.actionButtonText}>
            📷 Scan New Receipt
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]} 
          onPress={addTestReceipt}
          disabled={!isInitialized || loading}
        >
          <Text style={styles.secondaryButtonText}>+ Add Test Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]} 
          onPress={clearAllData}
          disabled={!isInitialized || loading || receipts.length === 0}
        >
          <Text style={styles.actionButtonText}>🗑 Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.receiptsContainer}>
        <Text style={styles.receiptsTitle}>Saved Receipts ({receipts.length})</Text>
        
        <ScrollView 
          style={styles.receiptsList}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshData} />
          }
        >
          {!isInitialized ? (
            <Text style={styles.emptyText}>Initializing database...</Text>
          ) : receipts.length === 0 ? (
            <Text style={styles.emptyText}>
              No receipts saved yet.{'\n'}Scan your first receipt to get started!
            </Text>
          ) : (
            receipts.map((receipt) => (
              <TouchableOpacity 
                key={receipt.id} 
                style={styles.receiptItem}
                onPress={() => viewReceiptDetails(receipt)}
              >
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptStoreName}>
                    {receipt.storeName || 'Unknown Store'}
                  </Text>
                  <Text style={styles.receiptAmount}>
                    {CURRENCY.symbol}{receipt.totalAmount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.receiptMeta}>
                  <Text style={styles.receiptDate}>
                    {receipt.date || 'No date'} • {receipt.items.length} items
                  </Text>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteReceipt(receipt)}
                  >
                    <Text style={styles.deleteButtonText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Database: {isInitialized ? '✅ Ready' : '⏳ Initializing...'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: SPACING.sm,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: COLORS.error,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: 'white',
    flex: 1,
    marginRight: SPACING.sm,
  },
  errorButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  errorButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  storesList: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  actionsContainer: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  actionButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  receiptsContainer: {
    flex: 1,
    margin: SPACING.md,
    marginTop: 0,
  },
  receiptsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  receiptsList: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: SPACING.xl,
    lineHeight: 24,
  },
  receiptItem: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    elevation: 1,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  receiptStoreName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  receiptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  footer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  receiptCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 2,
  },
  receiptStore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  receiptDate: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  receiptTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  receiptId: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  itemsSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  metaSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
});