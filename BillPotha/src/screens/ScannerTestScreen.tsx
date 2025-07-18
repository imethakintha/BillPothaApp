import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { ReceiptScanner } from '../components/ReceiptScanner';
import { ParsedReceiptData } from '../types';
import { COLORS, SPACING, CURRENCY } from '../utils/constants';

export const ScannerTestScreen: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ParsedReceiptData | null>(null);

  const handleReceiptScanned = (data: ParsedReceiptData) => {
    console.log('Receipt scanned:', data);
    setLastScanResult(data);
    setShowScanner(false);
    
    // Show success alert
    Alert.alert(
      'Receipt Scanned Successfully!',
      `Store: ${data.storeName || 'Unknown'}\nTotal: ${CURRENCY.symbol}${data.totalAmount}\nItems: ${data.items.length}\nConfidence: ${Math.round(data.confidence * 100)}%`,
      [{ text: 'OK' }]
    );
  };

  const handleScannerClose = () => {
    setShowScanner(false);
  };

  const startScanning = () => {
    setShowScanner(true);
  };

  if (showScanner) {
    return (
      <ReceiptScanner
        onReceiptScanned={handleReceiptScanned}
        onClose={handleScannerClose}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Receipt Scanner Test</Text>
          <Text style={styles.subtitle}>Test OCR & Data Parsing</Text>
        </View>

        <TouchableOpacity style={styles.scanButton} onPress={startScanning}>
          <Text style={styles.scanButtonText}>📷 Start Scanning</Text>
        </TouchableOpacity>

        {lastScanResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Last Scan Result</Text>
            
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Store:</Text>
                <Text style={styles.resultValue}>
                  {lastScanResult.storeName || 'Not detected'}
                </Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Date:</Text>
                <Text style={styles.resultValue}>
                  {lastScanResult.date || 'Not detected'}
                </Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total:</Text>
                <Text style={styles.resultValue}>
                  {lastScanResult.totalAmount > 0 
                    ? `${CURRENCY.symbol}${lastScanResult.totalAmount.toFixed(2)}`
                    : 'Not detected'
                  }
                </Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Confidence:</Text>
                <Text style={[
                  styles.resultValue,
                  { color: lastScanResult.confidence > 0.7 ? COLORS.success : 
                           lastScanResult.confidence > 0.4 ? COLORS.warning : COLORS.error }
                ]}>
                  {Math.round(lastScanResult.confidence * 100)}%
                </Text>
              </View>
            </View>

            {lastScanResult.items.length > 0 && (
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsTitle}>Items ({lastScanResult.items.length})</Text>
                {lastScanResult.items.map((item, index) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemPrice}>
                        {CURRENCY.symbol}{item.price.toFixed(2)}
                      </Text>
                    </View>
                    {item.quantity && item.quantity > 1 && (
                      <Text style={styles.itemQuantity}>
                        Qty: {item.quantity}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => setLastScanResult(null)}
            >
              <Text style={styles.clearButtonText}>Clear Results</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to Test:</Text>
          <Text style={styles.instructionsText}>
            1. Tap "Start Scanning" to open the camera{'\n'}
            2. Point your camera at a receipt{'\n'}
            3. Hold steady until text is detected{'\n'}
            4. The scanner will automatically process the receipt{'\n'}
            5. View the parsed results below
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginBottom: SPACING.xl,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  resultLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  itemsContainer: {
    marginBottom: SPACING.md,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  itemQuantity: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  clearButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructions: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});