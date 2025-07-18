import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Receipt, ParsedReceiptData, RootStackParamList } from '../types';
import { COLORS, SPACING, CURRENCY } from '../utils/constants';
import { useDatabase } from '../hooks/useDatabase';

type ReceiptDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReceiptDetail'>;
type ReceiptDetailScreenRouteProp = RouteProp<RootStackParamList, 'ReceiptDetail'>;

interface Props {
  navigation: ReceiptDetailScreenNavigationProp;
  route: ReceiptDetailScreenRouteProp;
}

export const ReceiptDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { receiptId, receiptData } = route.params;
  const [receipt, setReceipt] = useState<Receipt | ParsedReceiptData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { getReceipt, saveNewReceipt } = useDatabase();

  useEffect(() => {
    if (receiptId) {
      // Load existing receipt from database
      loadReceipt();
    } else if (receiptData) {
      // Use the scanned data
      setReceipt(receiptData);
    }
  }, [receiptId, receiptData]);

  const loadReceipt = async () => {
    if (!receiptId) return;
    
    setIsLoading(true);
    try {
      const loadedReceipt = await getReceipt(receiptId);
      if (loadedReceipt) {
        setReceipt(loadedReceipt);
      } else {
        Alert.alert('Error', 'Receipt not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error loading receipt:', error);
      Alert.alert('Error', 'Failed to load receipt', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReceipt = async () => {
    if (!receiptData) {
      Alert.alert('Error', 'No receipt data to save');
      return;
    }

    setIsSaving(true);
    try {
      const savedReceipt = await saveNewReceipt(receiptData);
      
      if (savedReceipt) {
        Alert.alert(
          'Success!',
          'Receipt saved successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to home screen
                navigation.navigate('Home');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save receipt. Please try again.');
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save receipt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No date';
    // Convert DD-MM-YYYY to a more readable format
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
      const day = parseInt(parts[0]);
      const month = months[parseInt(parts[1]) - 1];
      const year = parts[2];
      return `${day} ${month} ${year}`;
    }
    return dateString;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return COLORS.success;
    if (confidence >= 0.6) return COLORS.warning;
    return COLORS.error;
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading receipt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Receipt not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isScannedData = 'confidence' in receipt;
  const isExistingReceipt = 'id' in receipt;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Store Information */}
        <View style={styles.storeCard}>
          <Text style={styles.storeName}>
            {receipt.storeName || 'Unknown Store'}
          </Text>
          <Text style={styles.storeDate}>
            {formatDate(receipt.date)}
          </Text>
          {isScannedData && (
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Scan Confidence: </Text>
              <Text style={[
                styles.confidenceValue,
                { color: getConfidenceColor(receipt.confidence) }
              ]}>
                {getConfidenceText(receipt.confidence)} ({Math.round(receipt.confidence * 100)}%)
              </Text>
            </View>
          )}
        </View>

        {/* Total Amount */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>
            {CURRENCY.symbol}{(receipt.totalAmount || 0).toFixed(2)}
          </Text>
        </View>

        {/* Items List */}
        <View style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>
            Items ({receipt.items?.length || 0})
          </Text>
          
          {receipt.items && receipt.items.length > 0 ? (
            receipt.items.map((item, index) => (
              <View key={item.id || index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.quantity && item.quantity > 1 && (
                    <Text style={styles.itemQuantity}>
                      Quantity: {item.quantity}
                    </Text>
                  )}
                </View>
                <Text style={styles.itemPrice}>
                  {CURRENCY.symbol}{item.price.toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No items detected</Text>
          )}
        </View>

        {/* Metadata for existing receipts */}
        {isExistingReceipt && (
          <View style={styles.metadataCard}>
            <Text style={styles.sectionTitle}>Receipt Information</Text>
            <Text style={styles.metadataText}>
              ID: {receipt.id}
            </Text>
            <Text style={styles.metadataText}>
              Saved: {new Date(receipt.createdAt).toLocaleString()}
            </Text>
            {receipt.updatedAt !== receipt.createdAt && (
              <Text style={styles.metadataText}>
                Updated: {new Date(receipt.updatedAt).toLocaleString()}
              </Text>
            )}
          </View>
        )}

        {/* Extra spacing for save button */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Save Button - only show for scanned data */}
      {isScannedData && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveReceipt}
            disabled={isSaving}
          >
            {isSaving ? (
              <View style={styles.savingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>💾 Save to Device</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: 'center',
  },
  storeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  storeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  storeDate: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: SPACING.xs,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  itemsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  itemInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  itemName: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  itemQuantity: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: SPACING.lg,
  },
  metadataCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 1,
  },
  metadataText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontFamily: 'monospace',
  },
  spacer: {
    height: 100, // Space for the save button
  },
  buttonContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});