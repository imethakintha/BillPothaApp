import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
  useCameraPermission,
} from 'react-native-vision-camera';
import { OCRFrame, scanOCR } from 'vision-camera-ocr';
import { runOnJS } from 'react-native-reanimated';
import { COLORS, SPACING } from '../utils/constants';
import { ParsedReceiptData } from '../types';
import { ReceiptParserService } from '../services/ReceiptParserService';
import { processOCRFrame, isOCRTextValid, cleanOCRText, createThrottle } from '../utils/ocrUtils';

interface ReceiptScannerProps {
  onReceiptScanned: (data: ParsedReceiptData) => void;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onReceiptScanned,
  onClose,
}) => {
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.back;
  
  const { hasPermission, requestPermission } = useCameraPermission();
  
  const [isActive, setIsActive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [detectedText, setDetectedText] = useState<string>('');

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission().then((granted) => {
        if (!granted) {
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera access to scan receipts.',
            [{ text: 'OK', onPress: onClose }]
          );
        }
      });
    }
  }, [hasPermission, requestPermission, onClose]);

  // Parse receipt text using the enhanced service
  const parseReceiptText = useCallback((text: string): ParsedReceiptData => {
    const parsedData = ReceiptParserService.parseReceiptText(text);
    const confidence = ReceiptParserService.calculateConfidence(parsedData);
    
    return {
      ...parsedData,
      confidence,
    };
  }, []);

  // Handle OCR processing with throttling
  const processOCRResult = useCallback(
    createThrottle((result: any) => {
      setIsProcessing(true);
      
      const ocrResult = processOCRFrame(result);
      
      if (ocrResult.error) {
        console.warn('OCR Error:', ocrResult.error);
        setIsProcessing(false);
        return;
      }
      
      const cleanedText = cleanOCRText(ocrResult.text);
      setDetectedText(cleanedText);
      
      if (isOCRTextValid(cleanedText, 30)) {
        const parsedData = parseReceiptText(cleanedText);
        
        // Only trigger callback if we have reasonable confidence
        if (parsedData.confidence > 0.4) {
          setIsProcessing(false);
          setIsActive(false);
          onReceiptScanned(parsedData);
          return;
        }
      }
      
      setTimeout(() => setIsProcessing(false), 1000);
    }, 2000),
    [parseReceiptText, onReceiptScanned]
  );

  // Frame processor for real-time OCR
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    try {
      const result = scanOCR(frame);
      if (result && result.result && result.result.text) {
        runOnJS(processOCRResult)(result);
      }
    } catch (error) {
      console.log('OCR Error:', error);
    }
  }, [processOCRResult]);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        frameProcessorFps={2} // Process 2 frames per second
      />
      
      {/* Overlay UI */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scan Receipt</Text>
        </View>
        
        {/* Scanning Frame */}
        <View style={styles.scanFrame}>
          <View style={styles.scanCorner} />
          <View style={[styles.scanCorner, styles.topRight]} />
          <View style={[styles.scanCorner, styles.bottomLeft]} />
          <View style={[styles.scanCorner, styles.bottomRight]} />
        </View>
        
        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Position receipt within the frame
          </Text>
          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
        </View>
        
        {/* Debug Text Display */}
        {__DEV__ && detectedText && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText} numberOfLines={3}>
              {detectedText.substring(0, 100)}...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 40, // Offset for close button
  },
  scanFrame: {
    position: 'absolute',
    top: screenHeight * 0.2,
    left: screenWidth * 0.1,
    width: screenWidth * 0.8,
    height: screenHeight * 0.5,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
  },
  scanCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'white',
    borderWidth: 3,
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    top: 'auto',
    borderTopWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    top: 'auto',
    left: 'auto',
    borderTopWidth: 3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderRightWidth: 3,
  },
  instructions: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: SPACING.md,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  processingText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  debugContainer: {
    position: 'absolute',
    bottom: 100,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: SPACING.sm,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});