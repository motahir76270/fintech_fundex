// components/AepsWithdrawOptModal.tsx
import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import useFingerprintCapture from "@/hooks/use-aeps-fingerprint";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { aepsWithdrawApiCall } from "@/hooks/aepsApi/aepsServiceApi";
import { setAepsOtp } from "@/redux/aeps/aepsSlice";

const OTP_LENGTH = 6;
const EMPTY_PIN = Array(OTP_LENGTH).fill("");

interface AepsWithdrawOptModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (response: any) => void;
}

export default function AepsWithdrawOptModal({
  visible,
  onClose,
  onSuccess,
}: AepsWithdrawOptModalProps) {
  const { captureFingerprintOTP } = useFingerprintCapture();
  const { getLocation } = useSelector((state: any) => state.services);
  const dispatch = useDispatch();

  const [pin, setPin] = useState<string[]>(EMPTY_PIN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setPin(EMPTY_PIN);
      setError("");
      setIsLoading(false);
    }
  }, [visible]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handlePinChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "");

    if (cleaned.length > 1) {
      // Handle paste (full OTP)
      const pastedPin = cleaned.slice(0, OTP_LENGTH).split("");
      const newPin = [...pin];
      pastedPin.forEach((digit, i) => {
        if (i < OTP_LENGTH) newPin[i] = digit;
      });
      setPin(newPin);
      setError("");

      const firstEmptyIndex = newPin.findIndex((d) => d === "");
      if (firstEmptyIndex === -1) {
        inputRefs.current[OTP_LENGTH - 1]?.blur();
      } else {
        inputRefs.current[firstEmptyIndex]?.focus();
      }
      return;
    }

    const newPin = [...pin];
    newPin[index] = cleaned;
    setPin(newPin);
    setError("");

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !pin[index] && index > 0) {
      const newPin = [...pin];
      newPin[index - 1] = "";
      setPin(newPin);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const pinString = pin.join("");

    if (pinString.length !== OTP_LENGTH) {
      setError(`Please enter the ${OTP_LENGTH}-digit OTP`);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Read stored withdrawal payload
      const storedPayloadRaw = await AsyncStorage.getItem("aepsPayLoad");
      if (!storedPayloadRaw) {
        throw new Error("Transaction data missing. Please try again.");
      }
      const withdrawalPayload = JSON.parse(storedPayloadRaw);

      // ✅ Dispatch OTP BEFORE the API call so it's available in Redux
      dispatch(setAepsOtp(pinString));

      // Capture fingerprint
      const biometricData: any = await captureFingerprintOTP(pinString);
      if (!biometricData || !biometricData.dsrno) {
        throw new Error("Fingerprint not captured. Please try again.");
      }

      // Call withdraw API
      const res = await aepsWithdrawApiCall(
        withdrawalPayload,
        biometricData,
        getLocation
      );

      if (res?.status === "SUCCESS") {
        await AsyncStorage.removeItem("aepsPayLoad");
        dispatch(setAepsOtp(""));
        // ✅ Notify parent — parent will open the WithdrawReportModal
        onSuccess?.(res);
        onClose();
      } else {
        // ❌ Transaction failed — clear OTP and let user retry
        dispatch(setAepsOtp(""));
        const message =
          res?.message ||
          res?.data?.receiptData?.status ||
          "Transaction failed. Please try again.";
        setError(message);
        setPin(EMPTY_PIN);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      // ❌ Error — clear OTP and let user retry
      dispatch(setAepsOtp(""));
      setError(err?.message || "Something went wrong. Please try again.");
      setPin(EMPTY_PIN);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
      // ⚠️ Do NOT reset pin here — it clears the OTP even on success
      // before parent/components can read it.
    }
  };

  const handleClose = () => {
    if (isLoading) return; // prevent closing mid-transaction
    onClose();
  };

  const isSubmitDisabled = isLoading || pin.join("").length !== OTP_LENGTH;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalContent}>
          {/* Header */}
          <LinearGradient
            colors={["#4F1CA9", "#350083"]}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.modalHeaderContent}>
              <View style={styles.headerLeft}>
                <FontAwesome name="lock" size={20} color="#FFFFFF" />
                <Text style={styles.modalTitle}>Enter Aadhaar OTP</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                disabled={isLoading}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.modalBody}>
            {/* OTP Input */}
            <View style={styles.pinContainer}>
              <Text style={styles.pinLabel}>{OTP_LENGTH}-digit OTP</Text>

              <View style={styles.pinInputContainer}>
                {pin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.pinInput,
                      {
                        borderColor: error ? "#EF4444" : "#E5E7EB",
                      },
                    ]}
                    maxLength={1}
                    keyboardType="numeric"
                    secureTextEntry={true}
                    value={digit}
                    onChangeText={(text) => handlePinChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    editable={!isLoading}
                  />
                ))}
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitDisabled && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isSubmitDisabled
                    ? ["#9CA3AF", "#6B7280"]
                    : ["#4F1CA9", "#350083"]
                }
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Verify & Capture</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Link */}
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelLinkText}>Cancel</Text>
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
    justifyContent: "flex-end",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
    minHeight:"40%",
    maxHeight:"60%"
  },
  modalHeader: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 24,
  },
  pinContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pinInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  pinInput: {
    width: 50,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: "#F8F9FA",
    color: "#000000",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#EF4444",
  },
  submitButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  cancelLink: {
    alignItems: "center",
    padding: 12,
  },
  cancelLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
});