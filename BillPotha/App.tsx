import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, APP_NAME } from './src/utils/constants';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.subtitle}>Receipt Scanner & Expense Tracker</Text>
      <Text style={styles.status}>🚧 Under Development - Step 1 Complete! 🚧</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    color: COLORS.warning,
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 10,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
});
