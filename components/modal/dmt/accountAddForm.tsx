import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAllBanklist } from '@/hooks/servies/dmtApi';
import DateTimePicker from '@react-native-community/datetimepicker';

// Define the account schema with Zod
const accountSchema = z.object({
  name: z.string()
    .min(1, 'Account holder name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name should only contain letters and spaces'),
  
  bankId: z.string()
    .min(1, 'Please select a bank'),
  
  ifsc: z.string()
    .min(1, 'IFSC code is required')
    .length(11, 'IFSC code must be exactly 11 characters')
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format (e.g., SBIN0123456'),

  accountNo: z.string()
    .min(1, 'Account number is required')
    .min(9, 'Account number must be at least 9 digits')
    .max(18, 'Account number must not exceed 18 digits')
    .regex(/^\d+$/, 'Account number should only contain digits'),
  
  confirmAccountNo: z.string()
    .min(1, 'Please confirm account number'),
  
  pincode: z.string()
    .min(1, 'Pincode is required')
    .length(6, 'Pincode must be exactly 6 digits')
    .regex(/^\d+$/, 'Pincode should only contain digits'),
  
  dob: z.string()
    .min(1, 'Date of birth is required')
    .regex(/^(19|20)\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, 'Invalid date format (YYYY-MM-DD)')
}).refine((data) => data.accountNo === data.confirmAccountNo, {
  message: "Account numbers do not match",
  path: ["confirmAccountNo"],
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AddAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: AccountFormData) => Promise<void>;
}

const AddAccountModal = ({ visible, onClose, onSubmit }: AddAccountModalProps) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      bankId: '',
      ifsc: '',
      accountNo: '',
      confirmAccountNo: '',
      pincode: '',
      dob: '',
    }
  });
  
  const [banks, setBanks] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const selectedBankId = watch('bankId');


  useEffect(() => {
    if (visible) {
      loadBanks();
    }
  }, [visible]);

  const loadBanks = async () => {
    try {
      const res = await getAllBanklist();
      
      if(res?.status === "SUCCESS"){
        setBanks(res?.data?.dmtBankList || []);
      } else {
        Alert.alert("Error", res?.message || "Failed to load banks");
      }
    } catch  {
      Alert.alert("Error", "Bank data not fetched");
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      // Format date as YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setValue('dob', formattedDate);
    }
  };

  // Get selected bank
  const getSelectedBank = () => {
    return banks.find((bank: any) => bank.id.toString() === selectedBankId);
  };

  const selectedBank: any = getSelectedBank();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Bank Account</Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Account Holder Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Enter account holder name"
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>

            {/* Bank Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Select Bank <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Controller
                control={control}
                name="bankId"
                render={({ field: { onChange, value } }) => (
                  <View
                    style={[
                      styles.pickerContainer,
                      errors.bankId && styles.inputError,
                    ]}>
                    <Picker
                      selectedValue={value}
                      onValueChange={(itemValue) => {
                        onChange(itemValue);
                      }}
                      style={styles.picker}>
                      <Picker.Item label="Select a bank" value="" />
                      {banks.map((bank: any) => (
                        <Picker.Item
                          key={bank.id}
                          label={bank.name}
                          value={bank.id.toString()}
                        />
                      ))}
                    </Picker>
                  </View>
                )}
              />
              {errors.bankId && (
                <Text style={styles.errorText}>{errors.bankId.message}</Text>
              )}
            </View>

            {/* IFSC Field - Manual Entry Only */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                IFSC Code <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Controller
                control={control}
                name="ifsc"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.ifsc && styles.inputError]}
                    placeholder="Enter IFSC code (e.g., SBIN0001234)"
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text.toUpperCase())}
                    value={value}
                    autoCapitalize="characters"
                    maxLength={11}
                  />
                )}
              />
              {errors.ifsc && (
                <Text style={styles.errorText}>{errors.ifsc.message}</Text>
              )}
              <Text style={styles.helperText}>
                IFSC code should be 11 characters (e.g., SBIN0001234)
              </Text>
            </View>

            {/* Account Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Account Number <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Controller
                control={control}
                name="accountNo"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.accountNo && styles.inputError]}
                    placeholder="Enter account number"
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="numeric"
                    maxLength={18}
                  />
                )}
              />
              {errors.accountNo && (
                <Text style={styles.errorText}>{errors.accountNo.message}</Text>
              )}
            </View>

            {/* Confirm Account Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Confirm Account Number <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Controller
                control={control}
                name="confirmAccountNo"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      errors.confirmAccountNo && styles.inputError,
                    ]}
                    placeholder="Re-enter account number"
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="numeric"
                    maxLength={18}
                  />
                )}
              />
              {errors.confirmAccountNo && (
                <Text style={styles.errorText}>
                  {errors.confirmAccountNo.message}
                </Text>
              )}
            </View>

            {/* Pincode */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Pincode <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Controller
                control={control}
                name="pincode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.pincode && styles.inputError]}
                    placeholder="Enter pincode"
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                )}
              />
              {errors.pincode && (
                <Text style={styles.errorText}>{errors.pincode.message}</Text>
              )}
            </View>

            {/* Date of Birth with Calendar Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Date of Birth <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Controller
                control={control}
                name="dob"
                render={({ field: { value } }) => (
                  <>
                    <TouchableOpacity
                      style={[styles.datePickerButton, errors.dob && styles.inputError]}
                      onPress={() => setShowDatePicker(true)}>
                      <Text style={[styles.datePickerText, !value && styles.placeholderText]}>
                        {value || 'Select date of birth'}
                      </Text>
                      <MaterialIcons name="calendar-today" size={20} color="#666" />
                    </TouchableOpacity>
                    
                    {showDatePicker && (
                      <DateTimePicker
                        value={value ? new Date(value) : new Date(2000, 0, 1)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                      />
                    )}
                  </>
                )}
              />
              {errors.dob && (
                <Text style={styles.errorText}>{errors.dob.message}</Text>
              )}
              <Text style={styles.helperText}>Format: YYYY-MM-DD (Tap to select from calendar)</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}>
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Adding...' : 'Add Account'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: '90%',
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
    fontSize: 14,
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
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#F8F9FA',
  },
  datePickerText: {
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
});

export default AddAccountModal;