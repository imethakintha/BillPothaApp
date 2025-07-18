import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScannerTestScreen } from './src/screens/ScannerTestScreen';

export default function App() {
  return (
    <>
      <ScannerTestScreen />
      <StatusBar style="auto" />
    </>
  );
}
