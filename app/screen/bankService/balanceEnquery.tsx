import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, useColorScheme, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Ionicons } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import useFingerprintCapture from '@/hooks/use-aeps-fingerprint'
// import useFaceAuthCapture from '@/hooks/use-face-auth'
import { aepsBalanceEnquiryApiCall } from '@/hooks/aepsApi/aepsServiceApi'
import { BankSelectionModal } from '@/components/modal/BankSelectionModal'
import { getAllBankApiCall } from '@/hooks/aepsApi/updateKycApi'
import { BalanceReportModal } from '@/components/modal/aeps/balanceReportModal'
import HeaderSection from '@/components/navbar/header'


// Enhanced color theme
const colors = {
  light: {
    primary: '#350083',
    primaryDark: '#4F1CA9',
    secondary: '#10B981',
    text: '#1F2937',
    textLight: '#6B7280',
    textWhite: '#FFFFFF',
    icon: '#7C3AED',
    card: '#FFFFFF',
    inputBg: '#F9FAFB',
    inputText: '#111827',
    label: '#4B5563',
    error: '#EF4444',
    errorBg: '#FEF2F2',
    success: '#10B981',
    successBg: '#F0FDF4',
    border: '#E5E7EB',
    borderFocus: '#7C3AED',
    shadow: '#000000',
    background: '#F3F4F6',
    buttonDisabled: '#D1D5DB',
  },
  dark: {
    primary: '#032834',
    primaryDark: '#05445E',
    secondary: '#34D399',
    text: '#F9FAFB',
    textLight: '#9CA3AF',
    textWhite: '#FFFFFF',
    icon: '#A78BFA',
    card: '#1F2937',
    inputBg: '#374151',
    inputText: '#F9FAFB',
    label: '#9CA3AF',
    error: '#F87171',
    errorBg: '#7F1D1D',
    success: '#34D399',
    successBg: '#064E3B',
    border: '#374151',
    borderFocus: '#8B5CF6',
    shadow: '#000000',
    background: '#111827',
    buttonDisabled: '#4B5563',
  },
};

// Form validation schema
const withdrawalSchema = z.object({
  mobile: z
    .string()
    .min(10, 'Mobile number must be 10 digits')
    .max(10, 'Mobile number must be 10 digits')
    .regex(/^[0-9]+$/, 'Enter valid mobile number'),
  aadhar: z
    .string()
    .min(12, 'Aadhar number must be 12 digits')
    .max(12, 'Aadhar number must be 12 digits')
    .regex(/^[0-9]+$/, 'Enter valid Aadhar number'),
  bank: z
    .string()
    .min(1, 'Please select a bank'),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface Bank {
  id: number;
  name: string;
  ifscGlobal: string;
}

const BalanceEnquery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [allBankData, setAllBankData] = useState<Bank[]>([]);
  const [isFetchingBanks, setIsFetchingBanks] = useState(false);
  const [selectBankId, setSelectBankId] = useState("");
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | null>(null);
  
  const { getLocation } = useSelector((state: any) => state.services);
  const { captureFingerprint } = useFingerprintCapture();
  // const { captureFace } = useFaceAuthCapture();

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      mobile: '',
      aadhar: '',
      bank: '',
    },
  });

  const selectedBank = watch("bank");

  const handleBankInputPress = useCallback(async () => {
    if (allBankData.length === 0) {
      setIsFetchingBanks(true);
      try {
        const res = await getAllBankApiCall();
        if (res?.status === "SUCCESS") {
          setAllBankData(res?.data?.bank || []);
          setIsBankModalVisible(true);
        } else {
          Alert.alert("Error", res?.message || "Failed to fetch banks");
        }
      } catch {
        Alert.alert("Error", "Failed to fetch bank list");
      } finally {
        setIsFetchingBanks(false);
      }
    } else {
      setIsBankModalVisible(true);
    }
  }, [allBankData.length]);

  const handleSelectBank = useCallback((bank: any) => {
    setValue("bank", bank.name);
    setSelectBankId(bank.bid);
    setIsBankModalVisible(false);
  }, [setValue]);

  const parseResponseData = useCallback((response: any) => {
    try {
      let parsedResponse = null;
      let receiptData = response?.data?.receiptData || {};
      
      // Parse the response string if it exists
      if (receiptData?.response && typeof receiptData.response === 'string') {
        parsedResponse = JSON.parse(receiptData.response);
      } else if (response?.data?.response && typeof response.data.response === 'string') {
        parsedResponse = JSON.parse(response.data.response);
      }
      
      return {
        ...response,
        parsedResponse,
        receiptData,
      };
    } catch (error) {
      console.error("Error parsing response:", error);
      return {
        ...response,
        parsedResponse: null,
        receiptData: response?.data?.receiptData || {},
      };
    }
  }, []);

  const processBalanceEnquiry = useCallback(async (data: WithdrawalFormData, biometricData: any) => {
    if(!biometricData){
      Alert.alert("Error", "Biometric data not captured. Please try again.");
      return;
    }
    const payload = {
      mobile: data.mobile,
      aadhar: data.aadhar,
      bank: selectBankId,
    };
    const res = await aepsBalanceEnquiryApiCall(payload, biometricData, getLocation);
    
    // Parse and store the response for modal display
    const parsedResult = parseResponseData(res);
    setReportData(parsedResult);
    setIsReportModalVisible(true);
    
    return res;
  }, [getLocation, selectBankId, parseResponseData]);

  const onSubmit = useCallback(async (data: WithdrawalFormData) => {
    if (!getLocation?.latitude) {
      Alert.alert("Warning", "Please turn on location");
      return;
    }

    setIsLoading(true);
    setBiometricType('fingerprint');
    
    const biometricData = await captureFingerprint();
    
    if (!biometricData) {
      Alert.alert("Error", "Fingerprint not captured. Please try again.");
      setIsLoading(false);
      return;
    }

     await processBalanceEnquiry(data, biometricData);
    
    setIsLoading(false);
  }, [captureFingerprint, processBalanceEnquiry, getLocation]);
  
  // const handleFaceAuth = useCallback(async (data: WithdrawalFormData) => {
  //   if (!getLocation?.latitude) {
  //     Alert.alert("Warning", "Please turn on location");
  //     return;
  //   }

  //   setIsLoading(true);
  //   setBiometricType('face');
    
  //   const biometricData = await captureFace();
  //   if (!biometricData) {
  //     Alert.alert("Error", "Face not recognized. Please try again.");
  //     setIsLoading(false);
  //     return;
  //   }

  //   await processBalanceEnquiry(data, biometricData);
    
  //   setIsLoading(false);
  // }, [captureFace, processBalanceEnquiry, getLocation]);


  const InputField = ({ control, name, label, icon, placeholder, keyboardType, maxLength, theme, errors }: any) => (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name={icon} size={20} color={theme.icon} />
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: theme.label,
          marginLeft: 8,
        }}>
          {label}
        </Text>
        <Text style={{ color: theme.error, marginLeft: 4 }}>*</Text>
      </View>
      
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={{
              backgroundColor: theme.inputBg,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              color: theme.inputText,
              borderWidth: 1.5,
              borderColor: errors[name] ? theme.error : theme.border,
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            }}
            placeholder={placeholder}
            placeholderTextColor={theme.textLight}
            keyboardType={keyboardType}
            maxLength={maxLength}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      
      {errors[name] && (
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginTop: 6,
          backgroundColor: theme.errorBg,
          padding: 8,
          borderRadius: 8,
        }}>
          <Ionicons name="alert-circle" size={14} color={theme.error} />
          <Text style={{ color: theme.error, fontSize: 12, marginLeft: 6, flex: 1 }}>
            {errors[name].message}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      {/* Header */}
        <HeaderSection title="Balance Enquery" />


      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Card */}
        <View style={{
          backgroundColor: theme.card,
          borderRadius: 20,
          padding: 20,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
        }}>
          
          <InputField
            control={control}
            name="mobile"
            label="Mobile Number"
            icon="call-outline"
            placeholder="Enter 10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            theme={theme}
            errors={errors}
          />

          <InputField
            control={control}
            name="aadhar"
            label="Aadhar Number"
            icon="card-outline"
            placeholder="Enter 12-digit Aadhar number"
            keyboardType="numeric"
            maxLength={12}
            theme={theme}
            errors={errors}
          />

          {/* Bank Name Field */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="business-outline" size={20} color={theme.icon} />
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.label,
                marginLeft: 8,
              }}>
                Bank Name
              </Text>
              <Text style={{ color: theme.error, marginLeft: 4 }}>*</Text>
            </View>
            
            <TouchableOpacity 
              onPress={handleBankInputPress} 
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.inputBg,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: errors.bank ? theme.error : theme.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 14,
              }}
            >
              <Text style={{ 
                fontSize: 16, 
                color: selectedBank ? theme.inputText : theme.textLight,
                flex: 1,
              }}>
                {selectedBank || "Select bank"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.icon} />
            </TouchableOpacity>
            
            {errors.bank && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginTop: 6,
                backgroundColor: theme.errorBg,
                padding: 8,
                borderRadius: 8,
              }}>
                <Ionicons name="alert-circle" size={14} color={theme.error} />
                <Text style={{ color: theme.error, fontSize: 12, marginLeft: 6 }}>
                  {errors.bank.message}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12, marginTop: 8 }}>
            {/* Fingerprint Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={{
                backgroundColor: theme.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                opacity: isLoading && biometricType === 'fingerprint' ? 0.7 : 1,
                flexDirection: 'row',
                justifyContent: 'center',
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              {isLoading && biometricType === 'fingerprint' ? (
                <ActivityIndicator color={theme.textWhite} />
              ) : (
                <>
                  <Ionicons name="finger-print-outline" size={24} color={theme.textWhite} />
                  <Text style={{
                    color: theme.textWhite,
                    fontSize: 16,
                    fontWeight: '600',
                    marginLeft: 8,
                  }}>
                    Check Balance with Fingerprint
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Face Authentication Button */}
            {/* <TouchableOpacity
              onPress={handleSubmit(handleFaceAuth)}
              disabled={isLoading}
              style={{
                backgroundColor: theme.secondary,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                opacity: isLoading && biometricType === 'face' ? 0.7 : 1,
                flexDirection: 'row',
                justifyContent: 'center',
                shadowColor: theme.secondary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              {isLoading && biometricType === 'face' ? (
                <ActivityIndicator color={theme.textWhite} />
              ) : (
                <>
                  <Ionicons name="scan-outline" size={24} color={theme.textWhite} />
                  <Text style={{
                    color: theme.textWhite,
                    fontSize: 16,
                    fontWeight: '600',
                    marginLeft: 8,
                  }}>
                    Check Balance with Face Scan
                  </Text>
                </>
              )}
            </TouchableOpacity> */}

          </View>
        </View>

        {/* Info Note */}
        <View style={{
          marginTop: 20,
          padding: 12,
          backgroundColor: theme.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={{ fontSize: 12, color: theme.textLight, flex: 1 }}>
              Please ensure your biometric authentication (fingerprint or face) is ready before proceeding
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bank Selection Modal */}
      <BankSelectionModal
        visible={isBankModalVisible}
        onClose={() => setIsBankModalVisible(false)}
        banks={allBankData}
        selectedBank={selectedBank}
        onSelectBank={handleSelectBank}
        theme={theme}
        isLoading={isFetchingBanks}
      />

      {/* Balance Report Modal */}
      <BalanceReportModal
        visible={isReportModalVisible}
        onClose={() => {
          setIsReportModalVisible(false);
          setReportData(null);
        }}
        data={reportData}
        theme={theme}
      />
    </KeyboardAvoidingView>
  )
}

export default BalanceEnquery