import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { DatabaseTestScreen } from './src/screens/DatabaseTestScreen';

export default function App() {
  return (
    <>
      <DatabaseTestScreen />
      <StatusBar style="auto" />
    </>
  );
}
