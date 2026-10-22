// components/TransactionPinModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { dmtTransferOtpApiCall } from '@/hooks/servies/dmtApi';

interface TransactionPinModalProps {
  visible: boolean;
  onClose: () => void;
  // Remove theme and isDark from props since they're defined in the parent
}


export default function TransactionPinModal({
  visible,
  onClose
}: TransactionPinModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setPin(['', '', '', '']);
      setError('');
      setIsLoading(false);
    }
  }, [visible]);

  const handlePinChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const pastedPin = text.slice(0, 4).split('');
      const newPin = [...pin];
      pastedPin.forEach((digit, i) => {
        if (i < 4) newPin[i] = digit;
      });
      setPin(newPin);
      
      // Focus last input or next empty
      const lastFilledIndex = newPin.findIndex(d => d === '');
      if (lastFilledIndex === -1) {
        inputRefs.current[3]?.blur();
      } else {
        inputRefs.current[lastFilledIndex]?.focus();
      }
    } else {
      const newPin = [...pin];
      newPin[index] = text;
      setPin(newPin);
      setError('');

      // Auto-focus next input
      if (text && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const pinString = pin.join('');
    setIsLoading(true);
    try {
    const payload = {
        otp:pinString,
    }
     const res =  await dmtTransferOtpApiCall(payload);
   
     if(res?.status === "SUCCESS"){
        Alert.alert(`${res?.status}`, `${res.message}`)
        onClose();
     }else{    
        Alert.alert(`${res?.status}`, `${res.msg}`)
        onClose();
     }
    } catch (error: any) {
      setError(error.message || 'Invalid PIN');
      // Clear PIN on error
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    Alert.alert(`SUCCESS`,`Transaction Canciled or Failed`)
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={[styles.modalContent, { backgroundColor: '#FFFFFF' }]}>
          {/* Header */}
          <LinearGradient
            colors={['#4F1CA9', '#350083']}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.modalHeaderContent}>
              <View style={styles.headerLeft}>
                <FontAwesome name="lock" size={20} color="#FFFFFF" />
                <Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>
                  Enter Transaction PIN
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose } style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
          </LinearGradient>

          <View style={styles.modalBody}>
            {/* PIN Input */}
            <View style={styles.pinContainer}>
              <Text style={[styles.pinLabel, { color: '#6B7280' }]}>
                4-digit PIN
              </Text>
              
              <View style={styles.pinInputContainer}>
                {pin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref:any) => inputRefs.current[index] = ref}
                    style={[
                      styles.pinInput,
                      {
                        backgroundColor: '#F8F9FA',
                        borderColor: error ? '#EF4444' : '#E5E7EB',
                        color: '#000000',
                      }
                    ]}
                    maxLength={1}
                    keyboardType="numeric"
                    secureTextEntry={true}
                    value={digit}
                    onChangeText={(text) => handlePinChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    editable={!isLoading}
                    autoFocus={index === 0}
                  />
                ))}
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color="#EF4444" />
                <Text style={[styles.errorText, { color: '#EF4444' }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading || pin.join('').length !== 4}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4F1CA9', '#350083']}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                    Confirm Transaction
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Link */}
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelLinkText, { color: '#6B7280' }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 5,
  },
  transactionSummary: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  summaryText: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  modalBody: {
    padding: 24,
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  pinInput: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelLink: {
    alignItems: 'center',
    padding: 12,
  },
  cancelLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});