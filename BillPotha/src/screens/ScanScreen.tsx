import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { ReceiptScanner } from '../components/ReceiptScanner';
import { ParsedReceiptData, RootStackParamList } from '../types';

type ScanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Scanner'>;

interface Props {
  navigation: ScanScreenNavigationProp;
}

export const ScanScreen: React.FC<Props> = ({ navigation }) => {
  const handleReceiptScanned = (data: ParsedReceiptData) => {
    console.log('Receipt scanned in ScanScreen:', data);
    
    // Navigate to the detail screen with the scanned data
    navigation.navigate('ReceiptDetail', {
      receiptData: data,
    });
  };

  const handleScannerClose = () => {
    // Navigate back to the home screen
    navigation.goBack();
  };

  return (
    <ReceiptScanner
      onReceiptScanned={handleReceiptScanned}
      onClose={handleScannerClose}
    />
  );
};