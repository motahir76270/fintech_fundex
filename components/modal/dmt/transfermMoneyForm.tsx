import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define transaction schema with Zod
const transactionSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Please enter a valid amount (e.g., 100 or 100.50)')
    .refine((val) => {
      const num = parseFloat(val);
      return num > 0;
    }, 'Amount must be greater than 0')
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 100000;
    }, 'Maximum transaction limit is ₹1,00,000')
    .refine((val) => {
      const num = parseFloat(val);
      return num >= 10;
    }, 'Minimum transaction amount is ₹10'),
  
  paymentMode: z.enum(['IMPS', 'NEFT', 'RTGS'], {
          error: 'Please select a payment mode',
  }),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  selectedAccount: any;
}

const TransactionModal = ({
  visible,
  onClose,
  onSubmit,
  selectedAccount,
}: TransactionModalProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '',
      paymentMode: 'IMPS',
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!selectedAccount) return null;

  // Get payment mode limits
  const getPaymentModeInfo = (mode: string) => {
    switch(mode) {
      case 'IMPS':
        return { min: 10, max: 100000, time: '24x7 Instant' };
      case 'NEFT':
        return { min: 10, max: 100000, time: 'Settled in batches' };
      default:
        return { min: 10, max: 100000, time: '' };
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Money</Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Account Summary */}
          <View style={styles.accountSummary}>
            <View style={styles.bankIconContainer}>
              <MaterialIcons name="account-balance" size={32} color="#4CAF50" />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.bankName}>{selectedAccount.bank_name || selectedAccount.name}</Text>
              <Text style={styles.accountHolder}>
                {selectedAccount.name || selectedAccount.accountHolderName}
              </Text>
              <Text style={styles.accountNumber}>
                A/C No: {selectedAccount.accountNo || selectedAccount.accno}
              </Text>
              <Text style={styles.ifsc}>
                IFSC: {selectedAccount.ifsc}
              </Text>
            </View>
          </View>

          {/* Amount Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Amount (₹) <Text style={styles.requiredStar}>*</Text>
            </Text>
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.amount && styles.inputError]}
                  placeholder="Enter amount"
                  placeholderTextColor="#999"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="numeric"
                  maxLength={10}
                />
              )}
            />
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount.message}</Text>
            )}
            <Text style={styles.helperText}>
              Min: ₹10 | Max: ₹1,00,000
            </Text>
          </View>

          {/* Payment Mode Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Payment Mode <Text style={styles.requiredStar}>*</Text>
            </Text>
            <Controller
              control={control}
              name="paymentMode"
              render={({ field: { onChange, value } }) => (
                <View
                  style={[
                    styles.pickerContainer,
                    errors.paymentMode && styles.inputError,
                  ]}>
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={styles.picker}>
                    <Picker.Item label="Select Payment Mode" value="" />
                    <Picker.Item label="IMPS (Instant)" value="IMPS" />
                    <Picker.Item label="NEFT" value="NEFT" />
                    
                  </Picker>
                </View>
              )}
            />
            {errors.paymentMode && (
              <Text style={styles.errorText}>{errors.paymentMode.message}</Text>
            )}
            
            {/* Payment Mode Info */}
            {control._formValues.paymentMode && (
              <View style={styles.paymentModeInfo}>
                <Text style={styles.paymentModeInfoText}>
                  {getPaymentModeInfo(control._formValues.paymentMode).time}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}>
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Processing...' : 'Send Money'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  accountSummary: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  bankIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  accountHolder: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 13,
    color: '#999',
    marginBottom: 2,
  },
  ifsc: {
    fontSize: 12,
    color: '#999',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#FF5252',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#333',
  },
  inputError: {
    borderColor: '#FF5252',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: '#999',
    fontSize: 11,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  paymentModeInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  paymentModeInfoText: {
    fontSize: 12,
    color: '#1976D2',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransactionModal;