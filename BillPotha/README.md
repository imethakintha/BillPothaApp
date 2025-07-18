# Bill Potha - Receipt Scanner & Expense Tracker

A React Native mobile app for scanning and tracking receipts in Sri Lanka.

## 🎯 Project Overview

**Bill Potha** is a mobile receipt scanner and expense tracker specifically designed for the Sri Lankan market. Users can scan physical shopping receipts using their phone's camera, automatically extract key details using OCR technology, and track their expenses locally.

## 🚀 Features

- 📱 **Receipt Scanning**: Use camera to scan physical receipts
- 🔍 **OCR Technology**: Automatic text extraction from receipts
- 💾 **Local Storage**: All data stored locally on device
- 🏪 **Sri Lankan Stores**: Optimized for local retail formats
- 💱 **LKR Currency**: Built for Sri Lankan Rupees
- 🌐 **Multi-language**: Support for English, Sinhala, and Tamil text

## 🛠 Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Camera/OCR**: react-native-vision-camera + vision-camera-ocr
- **Navigation**: React Navigation
- **Database**: SQLite (expo-sqlite)
- **UI**: React Native Paper + Custom StyleSheet

## 📦 Dependencies

### Core Dependencies
- `react-native-vision-camera` - Camera functionality
- `vision-camera-ocr` - OCR text recognition
- `@react-navigation/native` - Navigation
- `@react-navigation/stack` - Stack navigation
- `react-native-paper` - UI components
- `expo-sqlite` - Local database
- `react-native-screens` - Native screen components
- `react-native-gesture-handler` - Gesture handling

### Development Dependencies
- `typescript` - Type checking
- `@types/react` - React type definitions
- `@types/react-native` - React Native type definitions

## 📁 Project Structure

```
BillPotha/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens
│   ├── services/           # Business logic & APIs
│   ├── utils/              # Utilities & constants
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── database/           # Database setup & queries
├── assets/                 # Images, fonts, etc.
├── App.tsx                 # Main app component
└── app.json               # Expo configuration
```

## 🎯 Development Plan

### ✅ Step 1: Project Setup & Structure (COMPLETED)
- [x] Initialize Expo project
- [x] Install all required dependencies
- [x] Set up TypeScript configuration
- [x] Create organized folder structure
- [x] Configure app permissions for camera
- [x] Set up constants and type definitions

### ✅ Step 2: OCR Camera Component (COMPLETED)
- [x] Build camera component with OCR capabilities
- [x] Implement real-time text recognition
- [x] Handle camera permissions
- [x] Create professional camera UI with scanning frame
- [x] Add throttling and error handling

### ✅ Step 3: Data Parsing & Structuring (COMPLETED)
- [x] Parse OCR text into structured data
- [x] Extract store name, date, items, and total
- [x] Handle Sri Lankan receipt formats
- [x] Advanced parsing algorithms with confidence scoring
- [x] Support for multiple Sri Lankan stores and currencies

### ⏳ Step 4: Database Setup
- [ ] Initialize SQLite database
- [ ] Create receipt and items tables
- [ ] Implement CRUD operations

### ⏳ Step 5: UI Screens & Navigation
- [ ] Create HomeScreen
- [ ] Create ScanScreen
- [ ] Create ReceiptDetailScreen
- [ ] Set up navigation between screens

### ⏳ Step 6: Integration & Finalization
- [ ] Connect all components
- [ ] Test complete user flow
- [ ] Polish UI and UX

## 🚦 Getting Started

1. **Clone and install**:
   ```bash
   cd BillPotha
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```

3. **Run on device**:
   - Install Expo Go app on your mobile device
   - Scan the QR code from the terminal
   - Or use `npm run android` / `npm run ios`

## 📱 Permissions Required

- **Camera Access**: For scanning receipts
- **Storage Access**: For saving captured images locally

## 🌍 Sri Lankan Market Optimization

- **Currency**: Sri Lankan Rupees (LKR)
- **Store Recognition**: Major Sri Lankan retail chains
- **Language Support**: English, Sinhala, Tamil text recognition
- **Receipt Formats**: Common Sri Lankan receipt layouts

## 📄 License

This project is for educational and personal use.

---

**Status**: 🚧 Under Development - Steps 1, 2 & 3 Complete!
**Next**: Database Setup