// components/KYCForm.tsx
import { aepsStatusCheck, doAepsKycApiCall } from "@/hooks/aepsApi/kycApi";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";

/* ---------------- Schema ---------------- */

const kycFormSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .length(10, "Phone number must be 10 digits")
    .regex(/^[0-9]+$/, "Phone number must contain only digits")
    .refine((val) => /^[6-9]/.test(val), {
      message: "Phone number must start with 6, 7, 8, or 9",
    }),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  pan: z
    .string()
    .min(1, "PAN is required")
    .length(10, "PAN must be exactly 10 characters")
    .regex(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/, {
      message: "Invalid PAN format (e.g., ABCDE1234F)",
    })
    .transform((val) => val.toUpperCase()),

  aadhaar: z
    .string()
    .min(1, "Aadhaar is required")
    .length(12, "Aadhaar must be 12 digits")
    .regex(/^[0-9]+$/, "Aadhaar must contain only digits")
    .refine((val) => /^[2-9]/.test(val), {
      message: "Aadhaar number cannot start with 0 or 1",
    }),

  name: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces"),

  dob: z
    .string()
    .min(1, "Date of birth is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 100);
      return date <= today && date >= minDate;
    }, "Please enter a valid date of birth (age between 18-100 years)"),

  pincode: z
    .string()
    .min(1, "Pincode is required")
    .length(6, "Pincode must be exactly 6 digits")
    .regex(/^[0-9]+$/, "Pincode must contain only digits"),

  gender: z
    .string()
    .min(1, "Gender is required")
    .refine((val) => ["M", "F"].includes(val.toUpperCase()), {
      message: "Gender must be Male or Female",
    }),

  address: z
    .string()
    .min(1, "Address is required")
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address is too long"),

  city: z
    .string()
    .min(1, "City is required")
    .min(2, "City name must be at least 2 characters")
    .max(50, "City name is too long"),
});

type KYCFormData = z.infer<typeof kycFormSchema>;




/* ---------------- Full Screen Loader Component ---------------- */

const FullScreenLoader = ({
  visible,
  message = "Please wait...",
}: {
  visible: boolean;
  message?: string;
}) => {
  if (!visible) return null;

  return (
    <View style={styles.fullScreenLoader}>
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#350083" />
        <Text style={styles.loaderText}>{message}</Text>
      </View>
    </View>
  );
};

/* ---------------- Main Component ---------------- */

const KYCForm = () => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";
  const { getLocation } = useSelector((state: any) => state.services);
  const { user } = useSelector((state: any) => state.auth);
  const userData = user?.data?.accountkycstatus;

  const dispatch = useDispatch();

  // Full screen loader state
  const [isLoading, setIsLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("Please wait...");

  const colors = {
    light: {
      primary: "#350083",
      gradientStart: "#4F1CA9",
      gradientEnd: "#350083",
      text: "#FFFFFF",
      icon: "#FFFFFF",
    },
    dark: {
      primary: "#032834",
      gradientStart: "#05445E",
      gradientEnd: "#032834",
      text: "#FFFFFF",
      icon: "#FFFFFF",
    },
  };

  const theme = isDark ? colors.dark : colors.light;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KYCFormData>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      phone: userData?.mobile || "",
      email: userData?.email || "",
      pan: userData?.pan || "",
      aadhaar: userData?.adhaar || "",
      name: userData?.name || "",
      dob: "",
      pincode: userData?.pin || "",
      gender: "",
      address: userData?.address || "",
      city: userData?.city || "",
    },
  });

  const onFormSubmit = async (data: KYCFormData) => {
    try {
      if (!getLocation?.latitude) {
        Alert.alert("Warning", "Please enable location first");
        return;
      }

      // Show full screen loader
      setIsLoading(true);
      setLoaderMessage("Submitting KYC details...");

      const payload = {
        phone: data.phone,
        email: data.email,
        pan: data.pan,
        aadhaar: data.aadhaar,
        name: data.name,
        dob: data.dob,
        pincode: data.pincode,
        gender: data.gender?.toUpperCase(),
        address: data.address,
        city: data.city,
        lat: getLocation.latitude,
        log: getLocation.longitude,
      };

      const res = await doAepsKycApiCall(payload, dispatch);
      if (res?.status === "SUCCESS") {
          await aepsStatusCheck(dispatch);
           router.push('/screen/aepsKyc/varifyFinger');
           reset();
           setIsLoading(false);
      } else {
        Alert.alert(`${res?.status}`, res.message);
        // reset();
      setIsLoading(false);
      }
    } catch {
      Alert.alert("Error", "Failed to submit KYC. Please try again.");
    }finally{
      setIsLoading(false);
    }
  };



  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {/* Full Screen Loader */}
        <FullScreenLoader visible={isLoading} message={loaderMessage} />

        {/* Header Section */}
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <FontAwesome5 name="angle-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            KYC Details
          </Text>
          <View style={styles.headerRight} />
        </LinearGradient>

        {/* Form Container */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.formContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.description}>
              Please enter your KYC details for verification.
            </Text>

            {/* Phone Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="call-outline" size={16} color={theme.primary} />
                <Text style={styles.label}>Phone Number *</Text>
              </View>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    maxLength={10}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone.message}</Text>
              )}
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="mail-outline" size={16} color={theme.primary} />
                <Text style={styles.label}>Email Address *</Text>
              </View>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Name Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <FontAwesome5 name="user" size={14} color={theme.primary} />
                <Text style={styles.label}>Full Name *</Text>
              </View>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999"
                    autoCapitalize="words"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>

            {/* DOB Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <FontAwesome5
                  name="calendar-alt"
                  size={14}
                  color={theme.primary}
                />
                <Text style={styles.label}>Date of Birth *</Text>
              </View>
              <Controller
                control={control}
                name="dob"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.dob && styles.inputError]}
                    placeholder="YYYY-MM-DD (e.g., 1990-01-15)"
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.dob && (
                <Text style={styles.errorText}>{errors.dob.message}</Text>
              )}
            </View>

            {/* Gender Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <FontAwesome5
                  name="venus-mars"
                  size={14}
                  color={theme.primary}
                />
                <Text style={styles.label}>Gender *</Text>
              </View>
              <Controller
                control={control}
                name="gender"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.gender && styles.inputError]}
                    placeholder="M / F"
                    placeholderTextColor="#999"
                    autoCapitalize="characters"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.gender && (
                <Text style={styles.errorText}>{errors.gender.message}</Text>
              )}
            </View>

            {/* PAN Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <FontAwesome5 name="id-card" size={14} color={theme.primary} />
                <Text style={styles.label}>PAN Number *</Text>
              </View>
              <Controller
                control={control}
                name="pan"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.pan && styles.inputError]}
                    placeholder="Enter PAN (e.g., ABCDE1234F)"
                    placeholderTextColor="#999"
                    autoCapitalize="characters"
                    maxLength={10}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.pan && (
                <Text style={styles.errorText}>{errors.pan.message}</Text>
              )}
            </View>

            {/* Aadhar Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={16}
                  color={theme.primary}
                />
                <Text style={styles.label}>Aadhar Number *</Text>
              </View>
              <Controller
                control={control}
                name="aadhaar"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.aadhaar && styles.inputError]}
                    placeholder="Enter 12-digit Aadhaar"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={12}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.aadhaar && (
                <Text style={styles.errorText}>{errors.aadhaar.message}</Text>
              )}
            </View>

            {/* Pincode Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={16}
                  color={theme.primary}
                />
                <Text style={styles.label}>Pincode *</Text>
              </View>
              <Controller
                control={control}
                name="pincode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.pincode && styles.inputError]}
                    placeholder="Enter 6-digit pincode"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={6}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.pincode && (
                <Text style={styles.errorText}>{errors.pincode.message}</Text>
              )}
            </View>

            {/* City Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={theme.primary}
                />
                <Text style={styles.label}>City *</Text>
              </View>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.city && styles.inputError]}
                    placeholder="Enter your city"
                    placeholderTextColor="#999"
                    autoCapitalize="words"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.city && (
                <Text style={styles.errorText}>{errors.city.message}</Text>
              )}
            </View>

            {/* Address Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={theme.primary}
                />
                <Text style={styles.label}>Address *</Text>
              </View>
              <Controller
                control={control}
                name="address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      styles.addressInput,
                      errors.address && styles.inputError,
                    ]}
                    placeholder="Enter your full address"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.address && (
                <Text style={styles.errorText}>{errors.address.message}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: theme.primary },
                isLoading && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit(onFormSubmit)}
              disabled={isLoading}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Submit KYC</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

      </View>
    </View>
  );
};

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 10 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  headerLeft: {
    padding: 8,
  },

  headerRight: {
    width: 40,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },

  formContainer: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 180,
  },

  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },

  inputGroup: {
    marginBottom: 16,
  },

  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },

  addressInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  inputError: {
    borderColor: "red",
  },

  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },

  submitBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 10,
  },

  submitBtnDisabled: {
    opacity: 0.7,
  },

  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },

  modalBody: {
    padding: 20,
    alignItems: "center",
    paddingBottom: 80,
  },

  otpIconContainer: {
    marginBottom: 20,
    alignItems: "center",
  },

  otpDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  otpPhoneNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 5,
    marginBottom: 20,
  },

  otpInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 20,
  },

  otpInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    backgroundColor: "#f5f5f5",
  },

  otpInputFilled: {
    borderColor: "#350083",
    backgroundColor: "#fff",
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 5,
  },

  otpErrorText: {
    color: "red",
    fontSize: 14,
  },

  verifyOtpButton: {
    backgroundColor: "#350083",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },

  verifyOtpButtonDisabled: {
    backgroundColor: "#ccc",
  },

  verifyOtpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  resendOtpContainer: {
    paddingVertical: 10,
  },

  resendOtpText: {
    fontSize: 14,
    color: "#666",
  },

  resendOtpLink: {
    color: "#350083",
    fontWeight: "600",
  },

  // Full Screen Loader Styles
  fullScreenLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 200,
  },

  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
});

export default KYCForm;
