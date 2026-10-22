import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getBankApiCall } from '@/hooks/servies/payoutApi';

// Define Zod schema for validation
const beneficiarySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  account: z.string()
    .min(1, 'Account number is required')
    .regex(/^\d{9,18}$/, 'Invalid account number (9-18 digits)'),
  ifsc: z.string()
    .min(1, 'IFSC code is required')
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format (e.g., SBIN0012345)'),
  passbook: z.any().refine((val) => val !== null && val !== undefined, {
    message: 'Passbook image is required',
  }),
  bank_name: z.string().min(2, 'Bank name is required'),
  bank_bid: z.string().min(1, 'Bank selection is required'),
});

type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

interface Bank {
  bid: string;
  name: string;
}

interface AddBeneficiaryModalProps {
  visible: boolean;
  onClose: () => void;
  onAddBeneficiary: (beneficiary: FormData) => void;
  theme: any;
  isDark: boolean;
}

export default function AddBeneficiaryModal({
  visible,
  onClose,
  onAddBeneficiary,
  theme,
  isDark,
}: AddBeneficiaryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    clearErrors,
    watch,
  } = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      name: '',
      account: '',
      bank_name: '',
      bank_bid: '',
      ifsc: '',
      passbook: null,
    },
  });

  const selectedBankName = watch('bank_name');

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = banks.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBanks(filtered);
    } else {
      setFilteredBanks(banks);
    }
  }, [searchQuery, banks]);

  const fetchBanks = async () => {
    try {
      const res = await getBankApiCall();
      if (res.status && res.data?.bank) {
        setBanks(res.data.bank);
        setFilteredBanks(res.data.bank);
      } else {
        Alert.alert('Error', res?.message || 'Failed to fetch banks');
      }
    } catch  {
      Alert.alert('Error', 'Failed to fetch bank list');
    }
  };

  const selectBank = (bank: Bank) => {
    setValue('bank_name', bank.name);
    setValue('bank_bid', bank.bid);
    clearErrors('bank_name');
    setShowBankDropdown(false);
    setSearchQuery('');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      
      const fileInfo = {
        uri: asset.uri,
        type: 'image/jpeg',
        name: `passbook_${Date.now()}.jpg`,
      };
      
      setValue('passbook', fileInfo);
      clearErrors('passbook');
    }
  };

  const onSubmit = async (data: BeneficiaryFormData) => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('account', data.account);
      formData.append('ifsc', data.ifsc);
      formData.append('bank_name', data.bank_name);
      formData.append('bank_bid', data.bank_bid);
      
      if (data.passbook) {
        formData.append('passbook', data.passbook);
      }
      
      await onAddBeneficiary(formData);
    } catch {
      Alert.alert('Error', 'Failed to add beneficiary. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    reset({
      name: '',
      account: '',
      ifsc: '',
      passbook: null,
      bank_name: '',
      bank_bid: '',
    });
    setImageUri(null);
    setSearchQuery('');
    setShowBankDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderFormFields = () => (
    <>
      {/* Name Field */}
      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <MaterialIcons name="person" size={20} color={theme.primary} style={styles.inputIcon} />
          <Text style={[styles.inputLabel, { color: theme.label }]}>Name</Text>
        </View>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: errors.name ? theme.error : theme.border,
                  color: isDark ? theme.text : '#000000',
                },
              ]}
              placeholder="Enter full name"
              placeholderTextColor={theme.label}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              selectionColor={theme.primary}
            />
          )}
        />
        {errors.name && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={16} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.name.message}
            </Text>
          </View>
        )}
      </View>

      {/* Bank Field */}
      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <MaterialIcons name="business" size={20} color={theme.primary} style={styles.inputIcon} />
          <Text style={[styles.inputLabel, { color: theme.label }]}>Bank Name</Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            {
              backgroundColor: theme.inputBg,
              borderColor: errors.bank_name ? theme.error : theme.border,
            },
          ]}
          onPress={() => setShowBankDropdown(!showBankDropdown)}
        >
          <Text style={[styles.dropdownButtonText, { color: selectedBankName ? (isDark ? theme.text : '#000000') : theme.label }]}>
            {selectedBankName || 'Select a bank'}
          </Text>
          <MaterialIcons 
            name={showBankDropdown ? "arrow-drop-up" : "arrow-drop-down"} 
            size={24} 
            color={theme.label} 
          />
        </TouchableOpacity>

        {errors.bank_name && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={16} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.bank_name.message}
            </Text>
          </View>
        )}
      </View>

      {/* Account Number Field */}
      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <MaterialIcons name="credit-card" size={20} color={theme.primary} style={styles.inputIcon} />
          <Text style={[styles.inputLabel, { color: theme.label }]}>Account Number</Text>
        </View>
        <Controller
          control={control}
          name="account"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: errors.account ? theme.error : theme.border,
                  color: isDark ? theme.text : '#000000',
                },
              ]}
              placeholder="Enter account number"
              placeholderTextColor={theme.label}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="number-pad"
              selectionColor={theme.primary}
            />
          )}
        />
        {errors.account && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={16} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.account.message}
            </Text>
          </View>
        )}
      </View>

      {/* IFSC Field */}
      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <MaterialIcons name="code" size={20} color={theme.primary} style={styles.inputIcon} />
          <Text style={[styles.inputLabel, { color: theme.label }]}>IFSC Code</Text>
        </View>
        <Controller
          control={control}
          name="ifsc"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: errors.ifsc ? theme.error : theme.border,
                  color: isDark ? theme.text : '#000000',
                },
              ]}
              placeholder="e.g., SBIN0012345"
              placeholderTextColor={theme.label}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="characters"
              selectionColor={theme.primary}
            />
          )}
        />
        {errors.ifsc && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={16} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.ifsc.message}
            </Text>
          </View>
        )}
      </View>

      {/* Passbook Image Field */}
      <View style={styles.inputContainer}>
        <View style={styles.labelRow}>
          <MaterialIcons name="photo-library" size={20} color={theme.primary} style={styles.inputIcon} />
          <Text style={[styles.inputLabel, { color: theme.label }]}>Passbook Image</Text>
        </View>
        <Controller
          control={control}
          name="passbook"
          render={({ field: { value } }) => (
            <>
              <TouchableOpacity
                style={[
                  styles.imageUploadButton,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: errors.passbook ? theme.error : theme.border,
                  },
                ]}
                onPress={pickImage}
              >
                {imageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <MaterialIcons name="check-circle" size={24} color={theme.success} />
                    <Text style={[styles.imageUploadText, { color: theme.success }]}>
                      Passbook image selected
                    </Text>
                    <TouchableOpacity onPress={() => {
                      setImageUri(null);
                      setValue('passbook', null);
                    }}>
                      <MaterialIcons name="close" size={20} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={24} color={theme.primary} />
                    <Text style={[styles.imageUploadText, { color: theme.primary }]}>
                      Tap to upload passbook image
                    </Text>
                    <Text style={[styles.imageUploadSubtext, { color: theme.label }]}>
                      JPG, PNG (Max 5MB)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {errors.passbook && (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error-outline" size={16} color={theme.error} />
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {errors.passbook.message as string}
                  </Text>
                </View>
              )}
            </>
          )}
        />
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: theme.border }]}
          onPress={handleClose}
        >
          <Text style={[styles.cancelButtonText, { color: theme.label }]}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, { shadowColor: theme.primary }]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={[theme.gradientStart, theme.gradientEnd]}
            style={styles.addButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.text} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color={theme.text} />
                <Text style={[styles.addButtonText, { color: theme.text }]}>Add Beneficiary</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={[styles.securityNote, { borderTopColor: theme.border }]}>
        <MaterialIcons name="security" size={16} color={theme.success} />
        <Text style={[styles.securityNoteText, { color: theme.label }]}>
          Beneficiary details and passbook image are encrypted and secure
        </Text>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
          <LinearGradient
            colors={[theme.gradientStart, theme.gradientEnd]}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.modalHeaderContent}>
              <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="person-add-outline" size={32} color={theme.text} />
              </View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Beneficiary</Text>
              <Text style={[styles.modalSubtitle, { color: 'rgba(255,255,255,0.9)' }]}>
                Add a new recipient for quick transfers
              </Text>
            </View>
          </LinearGradient>

          <FlatList
            data={[{ key: 'form' }]}
            renderItem={() => renderFormFields()}
            keyExtractor={() => 'form'}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            keyboardShouldPersistTaps="handled"
          />

          {/* Bank Dropdown Modal - Separate Modal to avoid nesting */}
          <Modal
            visible={showBankDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowBankDropdown(false)}
          >
            <TouchableOpacity 
              style={styles.dropdownModalOverlay}
              activeOpacity={1}
              onPress={() => setShowBankDropdown(false)}
            >
              <View style={[styles.dropdownModalContent, { backgroundColor: theme.card }]}>
                <View style={[styles.dropdownHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.dropdownHeaderTitle, { color: theme.text }]}>Select Bank</Text>
                  <TouchableOpacity onPress={() => setShowBankDropdown(false)}>
                    <MaterialIcons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.searchContainer, { borderBottomColor: theme.border }]}>
                  <MaterialIcons name="search" size={20} color={theme.label} />
                  <TextInput
                    style={[styles.searchInput, { color: isDark ? theme.text : '#000000' }]}
                    placeholder="Search banks..."
                    placeholderTextColor={theme.label}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <MaterialIcons name="close" size={20} color={theme.label} />
                    </TouchableOpacity>
                  )}
                </View>
                
                <FlatList
                  data={filteredBanks}
                  keyExtractor={(item,index) => index.toString()}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                      onPress={() => selectBank(item)}
                    >
                      <Text style={[styles.dropdownItemText, { color: isDark ? theme.text : '#000000' }]}>
                        {item.name}
                      </Text>
                      {selectedBankName === item.name && (
                        <MaterialIcons name="check" size={20} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: theme.label }]}>
                        No banks found
                      </Text>
                    </View>
                  )}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  modalHeaderContent: {
    alignItems: 'center',
    marginTop: 8,
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  flatListContent: {
    padding: 24,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 2,
  },
  dropdownButton: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  securityNoteText: {
    fontSize: 12,
    fontWeight: '500',
  },
  imageUploadButton: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 100,
  },
  imageUploadText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imageUploadSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // Dropdown Modal Styles
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    padding: 0,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 0.5,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});