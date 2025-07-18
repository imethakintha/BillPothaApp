import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';
import { RootStackParamList } from '../types';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { ReceiptDetailScreen } from '../screens/ReceiptDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          cardStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Bill Potha',
            headerTitleAlign: 'center',
          }}
        />
        
        <Stack.Screen
          name="Scanner"
          component={ScanScreen}
          options={{
            title: 'Scan Receipt',
            headerTitleAlign: 'center',
            // Hide header for full-screen camera
            headerShown: false,
          }}
        />
        
        <Stack.Screen
          name="ReceiptDetail"
          component={ReceiptDetailScreen}
          options={{
            title: 'Receipt Details',
            headerTitleAlign: 'center',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};