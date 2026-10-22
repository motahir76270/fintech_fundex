
import { useCompany } from "@/constants/string";
import { VarifyAddharKycApiCall, VarifyOtpApiCall } from "@/hooks/servies/dmtApi";
import useFingerprintCapture from "@/hooks/use-fingerprint-scanner";
import { onLocation } from "@/hooks/use-location";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  ScrollView,
  useColorScheme,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

// Color themes
const themes = {
  light: {
    primary: "#2563eb",
    primaryDark: "#1d4ed8",
    primaryLight: "#60a5fa",
    secondary: "#7c3aed",
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#1e293b",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    gradientStart: "#350083",
    gradientEnd: "#8b5cf6",
    cardShadow: "rgba(0, 0, 0, 0.1)",
    inputBg: "#f1f5f9",
  },
  dark: {
    primary: "#3b82f6",
    primaryDark: "#2563eb",
    primaryLight: "#60a5fa",
    secondary: "#8b5cf6",
    background: "#0f172a",
    surface: "#1e293b",
    text: "#f1f5f9",
    textSecondary: "#94a3b8",
    border: "#334155",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    gradientStart: "#3b82f6",
    gradientEnd: "#8b5cf6",
    cardShadow: "rgba(0, 0, 0, 0.3)",
    inputBg: "#334155",
  },
};

const RemiitEKYC = () => {
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { captureFingerprint, loading } = useFingerprintCapture();
  const [otpPinModalOpen, setOtpPinModalOpen] = useState(false);
  const [otpPin, setOtpPin] = useState("");
  const [isPinFocused, setIsPinFocused] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendEnabled, setResendEnabled] = useState(false);
  const location = useSelector((state: any) => state.services.getLocation);
  const dispatch = useDispatch();
  const company = useCompany();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? themes.dark : themes.light;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fingerprintPulse = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  useEffect(() => {
    if (!loading && showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, showSuccess]);

  useEffect(() => {
    let interval: any;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setResendEnabled(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const startFingerprintPulse = () => {
    if (pulseAnimation.current) {
      pulseAnimation.current.stop();
    }
    pulseAnimation.current = Animated.loop(
      Animated.sequence([
        Animated.timing(fingerprintPulse, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fingerprintPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.current.start();
  };

  const stopFingerprintPulse = () => {
    if (pulseAnimation.current) {
      pulseAnimation.current.stop();
      pulseAnimation.current = null;
    }
    Animated.timing(fingerprintPulse, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const showModal = () => {
    setOtpPinModalOpen(true);
    setOtpPin("");
    setCountdown(30);
    setResendEnabled(false);
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOtpPinModalOpen(false);
      setOtpPin("");
      setIsPinFocused(false);
    });
  };

  const formatAadhaar = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    }
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`;
  };

  const handleAadhaarChange = (text: string) => {
    const cleaned = text.replace(/\s/g, "");
    if (cleaned.length <= 12) {
      setAadhaarNumber(cleaned);
    }
  };

  const handleCaptureFingerprint = async () => {
    if (aadhaarNumber.length !== 12) {
      Alert.alert(
        "Invalid Aadhaar",
        "Please enter a valid 12-digit Aadhaar number",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    setApiLoading(true);

    try {
      let currentLocation = location;
      if (!currentLocation) {
        currentLocation = await onLocation(dispatch);
      }
      
      startFingerprintPulse();
      const PidData: any = await captureFingerprint();
      
      stopFingerprintPulse();      
      
      if (PidData) {
        const res = await VarifyAddharKycApiCall(aadhaarNumber, PidData?.pid_data, currentLocation);
        if (res?.status === "SUCCESS") {
          setShowSuccess(true);
          showModal();
          Alert.alert(`${res?.status}`, `${res?.message}`);
        } else {
          Alert.alert(`${res?.status}`, `${res?.message}`);
        }
      } else {
        Alert.alert("Error", "Failed to capture fingerprint");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      Alert.alert("Error", "An unexpected error occurred");
      stopFingerprintPulse();
    } finally {
      setApiLoading(false);
    }
  };

  const handleVerifyPin = async() => {
    if (otpPin.length === 4) {
        const res = await VarifyOtpApiCall(otpPin)
        if(res.status === "SUCCESS"){
          Alert.alert(`${res?.status}` , `${res?.message}`);
          router.replace("/(tabs)");
          hideModal();
        }else{
          Alert.alert(`${res?.status}` , `${res?.message}`);
        }
      // Navigate to next screen or perform additional actions
    } else {
      Alert.alert("Invalid PIN", "Please enter a valid 4-digit PIN");
    }
  };

  const handleResendPin = () => {
    setCountdown(30);
    setResendEnabled(false);
    // Add your resend PIN API call here
    Alert.alert("Resend", "A new PIN has been sent to your registered mobile number");
  };

  const handleBackPress = async () => {
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        
        {/* Gradient Header */}
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={["top"]} style={styles.safeHeader}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <View style={styles.headerTitleContainer}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#ffffff" />
                <Text style={styles.headerTitle}>Aadhaar Authentication</Text>
              </View>
              
              <View style={styles.headerPlaceholder} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  shadowColor: theme.cardShadow,
                  transform: [{ scale: scaleAnim }],
                  opacity: fadeAnim,
                },
              ]}
            > 
              {/* Success Badge */}
              {showSuccess && (
                <Animated.View style={[styles.successBadge, { backgroundColor: theme.success }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  <Text style={styles.successText}>Verification Successful!</Text>
                </Animated.View>
              )}

              {/* Icon Section */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[theme.gradientStart, theme.gradientEnd]}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image source={company.logo} style={{ width: 112, height: 92, borderRadius: 18 }}/>
                </LinearGradient>
              </View>

              <Text style={[styles.title, { color: theme.text }]}>Verify Your Identity</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Please authenticate using your Aadhaar number and fingerprint
              </Text>

              {/* Aadhaar Input Field */}
              <View style={styles.inputContainer}>
                <View style={styles.labelContainer}>
                  <Ionicons name="card-outline" size={18} color={theme.primary} />
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Aadhaar Number</Text>
                </View>
                
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: isFocused ? theme.primary : theme.border,
                      backgroundColor: theme.inputBg,
                    },
                  ]}
                >
                  <Ionicons name="finger-print" size={20} color={theme.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="XXXX XXXX XXXX"
                    placeholderTextColor={theme.textSecondary}
                    value={formatAadhaar(aadhaarNumber)}
                    onChangeText={handleAadhaarChange}
                    keyboardType="numeric"
                    maxLength={14}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    editable={!loading && !apiLoading}
                  />
                  {aadhaarNumber.length === 12 && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                  )}
                </View>
                
                <Text style={[styles.inputHint, { color: theme.textSecondary }]}>
                  Enter your 12-digit Aadhaar number
                </Text>
              </View>

              {/* Verification Button */}
              <Animated.View style={{ transform: [{ scale: fingerprintPulse }] }}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: theme.primary,
                      opacity: (loading || apiLoading || aadhaarNumber.length !== 12) ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleCaptureFingerprint}
                  disabled={loading || apiLoading || aadhaarNumber.length !== 12}
                  activeOpacity={0.8}
                >
                  {(loading || apiLoading) ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.buttonText}> 
                        {loading ? " Capturing..." : " Verifying..."}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="finger-print-outline" size={22} color="#ffffff" />
                      <Text style={styles.buttonText}> Verify with Fingerprint</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Info Section */}
              <View style={[styles.infoSection, { backgroundColor: theme.inputBg }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  Your biometric data is securely encrypted and will not be stored
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* OTP PIN Modal */}
        <Modal
          transparent={true}
          visible={otpPinModalOpen}
          animationType="none"
          onRequestClose={hideModal}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    backgroundColor: theme.surface,
                    opacity: modalFadeAnim,
                    transform: [{ scale: modalScaleAnim }],
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <LinearGradient
                    colors={[theme.gradientStart, theme.gradientEnd]}
                    style={styles.modalHeaderGradient}
                  >
                    <Ionicons name="keypad-outline" size={32} color="#ffffff" />
                    <Text style={styles.modalTitle}>Enter PIN</Text>
                  </LinearGradient>
                </View>

                <View style={styles.modalContent}>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                    Please enter the 6-digit PIN sent to your registered mobile number
                  </Text>

                  <View style={styles.pinInputContainer}>
                    <View
                      style={[
                        styles.pinInputWrapper,
                        {
                          borderColor: isPinFocused ? theme.primary : theme.border,
                          backgroundColor: theme.inputBg,
                        },
                      ]}
                    >
                      <Ionicons name="lock-closed-outline" size={20} color={theme.primary} style={styles.pinIcon} />
                      <TextInput
                        style={[styles.pinInput, { color: theme.text }]}
                        placeholder="Enter 6-digit PIN"
                        placeholderTextColor={theme.textSecondary}
                        value={otpPin}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/\D/g, "");
                          if (cleaned.length <= 6) {
                            setOtpPin(cleaned);
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={6}
                        secureTextEntry
                        onFocus={() => setIsPinFocused(true)}
                        onBlur={() => setIsPinFocused(false)}
                        autoFocus={true}
                      />
                      {otpPin.length === 6 && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                      )}
                    </View>
                  </View>

                  <View style={styles.pinActions}>
                    <TouchableOpacity
                      style={[styles.verifyButton, { backgroundColor: theme.primary }]}
                      onPress={handleVerifyPin}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-done-outline" size={20} color="#ffffff" />
                      <Text style={styles.verifyButtonText}>Verify PIN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.resendButton,
                        { 
                          backgroundColor: theme.inputBg,
                          opacity: resendEnabled ? 1 : 0.5 
                        }
                      ]}
                      onPress={handleResendPin}
                      disabled={!resendEnabled}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh-outline" size={20} color={theme.primary} />
                      <Text style={[styles.resendButtonText, { color: theme.primary }]}>
                        {resendEnabled ? "Resend PIN" : `Resend in ${countdown}s`}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={hideModal}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {(loading || apiLoading) && (
          <View style={styles.loaderOverlay}>
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loaderText}>
                {loading ? "Capturing Fingerprint..." : "Verifying Aadhaar..."}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default RemiitEKYC;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  safeHeader: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerPlaceholder: {
    width: 40,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 30,                       
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    marginBottom: 20,
    gap: 8,
  },
  successText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 32,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
    paddingVertical: 12,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loaderBox: {
    backgroundColor: "#dbe0e9",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    minWidth: 200,
  },
  loaderText: {
    color: "#080707",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    borderRadius: 24,
    overflow: "hidden",
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalHeader: {
    overflow: "hidden",
  },
  modalHeaderGradient: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  modalContent: {
    padding: 24,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  pinInputContainer: {
    marginBottom: 24,
  },
  pinInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  pinIcon: {
    marginRight: 12,
  },
  pinInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 2,
    paddingVertical: 12,
  },
  pinActions: {
    gap: 12,
    marginBottom: 16,
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  verifyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});