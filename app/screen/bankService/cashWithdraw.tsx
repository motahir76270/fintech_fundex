import useFingerprintCapture from "@/hooks/use-aeps-fingerprint";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { z } from "zod";
// import useFaceAuthCapture from '@/hooks/use-face-auth'
import { WithdrawReportmodal } from "@/components/modal/aeps/withdrawReportmodal";
import { BankSelectionModal } from "@/components/modal/BankSelectionModal";
import {
  aepsWithdrawApiCall,
  aepsWithdrawOTPApiCall,
} from "@/hooks/aepsApi/aepsServiceApi";
import { getAllBankApiCall } from "@/hooks/aepsApi/updateKycApi";
import AepsWithdrawOptModal from "@/components/modal/aeps/aepsOptModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HeaderSection from "@/components/navbar/header";

// ✅ Threshold above which OTP flow is triggered
const OTP_THRESHOLD = 5000;

// Enhanced color theme
const colors = {
  light: {
    primary: "#350083",
    primaryDark: "#6D28D9",
    secondary: "#10B981",
    danger: "#EF4444",
    text: "#1F2937",
    textLight: "#6B7280",
    textWhite: "#FFFFFF",
    icon: "#7C3AED",
    card: "#FFFFFF",
    inputBg: "#F9FAFB",
    inputText: "#111827",
    label: "#4B5563",
    error: "#EF4444",
    errorBg: "#FEF2F2",
    success: "#10B981",
    successBg: "#F0FDF4",
    border: "#E5E7EB",
    borderFocus: "#7C3AED",
    shadow: "#000000",
    background: "#F3F4F6",
    buttonDisabled: "#D1D5DB",
  },
  dark: {
    primary: "#350083",
    primaryDark: "#7C3AED",
    secondary: "#34D399",
    danger: "#F87171",
    text: "#F9FAFB",
    textLight: "#9CA3AF",
    textWhite: "#FFFFFF",
    icon: "#A78BFA",
    card: "#1F2937",
    inputBg: "#374151",
    inputText: "#F9FAFB",
    label: "#9CA3AF",
    error: "#F87171",
    errorBg: "#7F1D1D",
    success: "#34D399",
    successBg: "#064E3B",
    border: "#374151",
    borderFocus: "#8B5CF6",
    shadow: "#000000",
    background: "#111827",
    buttonDisabled: "#4B5563",
  },
};

// ✅ Zod schema — corrected (used `required_error` / `invalid_type_error` for Zod v3)
const withdrawalSchema = z.object({
  mobile: z
    .string()
    .min(10, "Mobile number must be 10 digits")
    .max(10, "Mobile number must be 10 digits")
    .regex(/^[0-9]+$/, "Enter valid mobile number"),
  aadhar: z
    .string()
    .min(12, "Aadhar number must be 12 digits")
    .max(12, "Aadhar number must be 12 digits")
    .regex(/^[0-9]+$/, "Enter valid Aadhar number"),
  bank: z.string().min(1, "Please select a bank"),
  amount: z
    .number({
      error: "Amount is required",
    })
    .min(100, "Minimum withdrawal amount is ₹100")
    .max(10000, "Maximum withdrawal amount is ₹10,000"),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface Bank {
  id: number;
  name: string;
  ifscGlobal: string;
  bid?: string;
}

// ✅ InputField moved OUTSIDE component to avoid remount on every render
interface InputFieldProps {
  control: any;
  name: keyof WithdrawalFormData;
  label: string;
  icon: any;
  placeholder: string;
  keyboardType?: any;
  maxLength?: number;
  theme: any;
  errors: any;
}

const InputField = ({
  control,
  name,
  label,
  icon,
  placeholder,
  keyboardType,
  maxLength,
  theme,
  errors,
}: InputFieldProps) => (
  <View style={{ marginBottom: 20 }}>
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
    >
      <Ionicons name={icon} size={20} color={theme.icon} />
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: theme.label,
          marginLeft: 8,
        }}
      >
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
            fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.textLight}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onBlur={onBlur}
          onChangeText={(text) => {
            if (name === "amount") {
              onChange(text === "" ? undefined : Number(text));
            } else if (name === "mobile" || name === "aadhar") {
              // ✅ Strip non-numeric characters
              onChange(text.replace(/[^0-9]/g, ""));
            } else {
              onChange(text);
            }
          }}
          value={
            value === undefined || value === null ? "" : value.toString()
          }
        />
      )}
    />

    {errors[name] && (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 6,
          backgroundColor: theme.errorBg,
          padding: 8,
          borderRadius: 8,
        }}
      >
        <Ionicons name="alert-circle" size={14} color={theme.error} />
        <Text
          style={{ color: theme.error, fontSize: 12, marginLeft: 6, flex: 1 }}
        >
          {errors[name]?.message as string}
        </Text>
      </View>
    )}
  </View>
);

const CashWithdraw = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [withdrawOtpModalVisible, setWithdrawOtpModalVisible] = useState(false);
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [allBankData, setAllBankData] = useState<Bank[]>([]);
  const [isFetchingBanks, setIsFetchingBanks] = useState(false);
  const [selectBankId, setSelectBankId] = useState("");
  const [biometricType, setBiometricType] = useState<
    "fingerprint" | "face" | null
  >(null);

  const { captureFingerprint } = useFingerprintCapture();
  // const { captureFace } = useFaceAuthCapture();
  const { getLocation } = useSelector((state: any) => state.services);

  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? colors.dark : colors.light;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      mobile: "",
      aadhar: "",
      bank: "",
      // ✅ Cast to any — a numeric schema requires a number, but we start empty
      amount: undefined as any,
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

  const handleSelectBank = useCallback(
    (bank: any) => {
      setValue("bank", bank?.name, { shouldValidate: true });
      setSelectBankId(bank?.bid || bank?.id?.toString() || "");
      setIsBankModalVisible(false);
    },
    [setValue],
  );

  const processWithdrawal = useCallback(
    async (data: WithdrawalFormData, biometricData: any) => {
      const payload = {
        mobile: data.mobile,
        aadhar: data.aadhar,
        bank: selectBankId,
        amount: data.amount,
      };

      const res = await aepsWithdrawApiCall(
        payload,
        biometricData,
        getLocation,
      );
      return res;
    },
    [getLocation, selectBankId],
  );

  const onSubmit = useCallback(
    async (data: WithdrawalFormData) => {
      // ✅ Validate bank selection
      if (!selectBankId) {
        Alert.alert("Error", "Please select a bank");
        return;
      }

      // ✅ Validate location
      if (!getLocation?.latitude) {
        Alert.alert("Warning", "Please turn on location");
        return;
      }

      try {
        // ✅ OTP flow for high-value transactions
        if (data.amount && data.amount > OTP_THRESHOLD) {
          const aepsOtpPayload = {
            mobile: data.mobile,
            aadhar: data.aadhar,
            bank: selectBankId,
            amount: data.amount,
          };

          // ✅ Save payload for the OTP modal to read
          await AsyncStorage.setItem(
            "aepsPayLoad",
            JSON.stringify(aepsOtpPayload),
          );

          const checkAepsRes = await aepsWithdrawOTPApiCall(
            aepsOtpPayload,
            getLocation,
          );

          if (checkAepsRes?.statuscode === "OTP") {
            setWithdrawOtpModalVisible(true);
          } else {
            Alert.alert(
              "Failed",
              checkAepsRes?.message || "OTP request failed",
            );
          }
          return; // stop here; OTP modal handles the next step
        }

        // ✅ Fingerprint flow for lower-value transactions
        setIsLoading(true);
        setBiometricType("fingerprint");

        const biometricData: any = await captureFingerprint();
        if (!biometricData || !biometricData.dsrno) {
          Alert.alert("Error", "Fingerprint not captured. Please try again.");
          return;
        }

        const response = await processWithdrawal(data, biometricData);
 
        if (response?.status === "SUCCESS") {
          setReportData(response);
          setIsReportModalVisible(true);
          reset();
          setSelectBankId("");
        } else {
          Alert.alert(
            response?.data?.receiptData?.status || "Failed",
            response?.message || "Withdrawal failed",
          );
        }
      } catch (err: any) {
        Alert.alert("Error", err?.message || "Something went wrong");
      } finally {
        setIsLoading(false);
        setBiometricType(null);
      }
    },
    [
      captureFingerprint,
      processWithdrawal,
      reset,
      getLocation,
      selectBankId,
    ],
  );

  // const handleFaceAuth = useCallback(async (data: WithdrawalFormData) => {
  //   ...unchanged
  // }, [captureFace, processWithdrawal, reset, getLocation]);

  // ✅ Called by OTP modal on success
  const handleOtpSuccess = useCallback(
    (response: any) => {
      setReportData(response?.data || response?.data?.receiptData);
      setIsReportModalVisible(true);
      reset();
      setSelectBankId("");
    },
    [reset],
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      {/* Header */}
          <HeaderSection title="Cash Withdraw" />
    

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Card */}
        <View
          style={{
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 20,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
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
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Ionicons name="business-outline" size={20} color={theme.icon} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: theme.label,
                  marginLeft: 8,
                }}
              >
                Bank Name
              </Text>
              <Text style={{ color: theme.error, marginLeft: 4 }}>*</Text>
            </View>

            <TouchableOpacity
              onPress={handleBankInputPress}
              activeOpacity={0.7}
              disabled={isFetchingBanks}
              style={{
                backgroundColor: theme.inputBg,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: errors.bank ? theme.error : theme.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 14,
              }}
            >
              {isFetchingBanks ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 16,
                      color: selectedBank ? theme.inputText : theme.textLight,
                      flex: 1,
                    }}
                  >
                    {selectedBank || "Select bank"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.icon} />
                </>
              )}
            </TouchableOpacity>

            {errors.bank && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 6,
                  backgroundColor: theme.errorBg,
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="alert-circle" size={14} color={theme.error} />
                <Text
                  style={{ color: theme.error, fontSize: 12, marginLeft: 6 }}
                >
                  {errors.bank.message as string}
                </Text>
              </View>
            )}
          </View>

          <InputField
            control={control}
            name="amount"
            label="Amount (₹)"
            icon="cash-outline"
            placeholder="Enter amount (₹100 - ₹10,000)"
            keyboardType="numeric"
            maxLength={6}
            theme={theme}
            errors={errors}
          />

          {/* Action Buttons */}
          <View style={{ gap: 12, marginTop: 8 }}>
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading
                  ? theme.buttonDisabled
                  : theme.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              {isLoading && biometricType === "fingerprint" ? (
                <ActivityIndicator color={theme.textWhite} />
              ) : (
                <>
                  <Ionicons
                    name="finger-print-outline"
                    size={24}
                    color={theme.textWhite}
                  />
                  <Text
                    style={{
                      color: theme.textWhite,
                      fontSize: 16,
                      fontWeight: "600",
                      marginLeft: 8,
                    }}
                  >
                    Withdraw with Fingerprint
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Note */}
        <View
          style={{
            marginTop: 20,
            padding: 12,
            backgroundColor: theme.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.primary}
            />
            <Text style={{ fontSize: 12, color: theme.textLight, flex: 1 }}>
              Minimum withdrawal: ₹100 | Maximum withdrawal: ₹10,000
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={theme.success}
            />
            <Text style={{ fontSize: 12, color: theme.textLight, flex: 1 }}>
              Transactions above ₹{OTP_THRESHOLD.toLocaleString()} require
              Aadhaar OTP verification
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

      {/* Withdraw Report Modal */}
      <WithdrawReportmodal
        visible={isReportModalVisible}
        onClose={() => {
          setIsReportModalVisible(false);
          setReportData(null);
        }}
        data={reportData}
        theme={theme}
      />

      {/* OTP Modal */}
      <AepsWithdrawOptModal
        visible={withdrawOtpModalVisible}
        onClose={() => setWithdrawOtpModalVisible(false)}
        onSuccess={handleOtpSuccess}
      />
    </View>
  );
};

export default CashWithdraw;