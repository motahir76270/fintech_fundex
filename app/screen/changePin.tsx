import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";

import { pinChangeApiCall } from "@/hooks/authApi/forgetPasswordApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useCompany } from "@/constants/string";
import HeaderSection from "@/components/navbar/header";

/* ---------------- ZOD SCHEMA ---------------- */
const changePinSchema = z
  .object({
    oldPin: z
      .string()
      .min(4, "Old PIN must be at least 4 digits")
      .max(4, "Old PIN must be at most 4 digits"),
    newPin: z
      .string()
      .min(4, "New PIN must be at least 4 digits")
      .max(4, "New PIN must be at most 4 digits"),
    confirmPin: z.string(),
  })
  .refine((data) => data.newPin !== data.oldPin, {
    message: "New PIN must be different from Old PIN",
    path: ["newPin"],
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

type ChangePinForm = z.infer<typeof changePinSchema>;

export default function ChangePinScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const company = useCompany();

  // State for PIN visibility
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePinForm>({
    resolver: zodResolver(changePinSchema),
    defaultValues: {
      oldPin: "",
      newPin: "",
      confirmPin: "",
    },
  });

  const onSubmit = async (datas: ChangePinForm) => {
    const payload = {
      current_pin: datas?.oldPin,
      new_pin: datas?.newPin,
    };

    setIsLoading(true); // Show loading indicator

    try {
      const data = await pinChangeApiCall(payload);

      if (data?.status === "SUCCESS") {
        Alert.alert(`${data?.status}`, `${data?.message}`);
        router.replace("/(tabs)");
      } else {
        Alert.alert(`${data.status}`, `${data?.message}`);
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  const colors = {
    background: isDark ? "#021a22" : "#eaf3f6",
    header: isDark ? "#032834" : "#350083",
    card: isDark ? "#0f2b33" : "#ffffff",
    text: isDark ? "#ffffff" : "#000000",
    subText: isDark ? "#cbd5e1" : "#374151",
    inputBorder: isDark ? "#2f4f58" : "#d1d5db",
    button: isDark ? "#0b4a5a" : "#350083",
    error: "#ef4444",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
    <HeaderSection title="PIN Change" />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={company.logo}
            style={{ width: 112, height: 82, borderRadius: 18 }}
          />
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Old PIN */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="oldPin"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Old Pin"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showOldPin}
                  keyboardType="number-pad"
                  value={value}
                  onChangeText={onChange}
                  maxLength={4}
                  editable={!isLoading}
                  style={[
                    styles.input,
                    { borderColor: colors.inputBorder, color: colors.text },
                  ]}
                />
              )}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowOldPin(!showOldPin)}
              disabled={isLoading}
            >
              <Ionicons
                name={showOldPin ? "eye-off" : "eye"}
                size={24}
                color={colors.subText}
              />
            </TouchableOpacity>
          </View>
          {errors.oldPin && (
            <Text style={[styles.error, { color: colors.error }]}>
              {errors.oldPin.message}
            </Text>
          )}

          {/* New PIN */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="newPin"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="New Pin"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showNewPin}
                  keyboardType="number-pad"
                  value={value}
                  onChangeText={onChange}
                  maxLength={4}
                  editable={!isLoading}
                  style={[
                    styles.input,
                    { borderColor: colors.inputBorder, color: colors.text },
                  ]}
                />
              )}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPin(!showNewPin)}
              disabled={isLoading}
            >
              <Ionicons
                name={showNewPin ? "eye-off" : "eye"}
                size={24}
                color={colors.subText}
              />
            </TouchableOpacity>
          </View>
          {errors.newPin && (
            <Text style={[styles.error, { color: colors.error }]}>
              {errors.newPin.message}
            </Text>
          )}

          {/* Confirm PIN */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="confirmPin"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Confirm Pin"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showConfirmPin}
                  keyboardType="number-pad"
                  value={value}
                  onChangeText={onChange}
                  maxLength={4}
                  editable={!isLoading}
                  style={[
                    styles.input,
                    { borderColor: colors.inputBorder, color: colors.text },
                  ]}
                />
              )}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPin(!showConfirmPin)}
              disabled={isLoading}
            >
              <Ionicons
                name={showConfirmPin ? "eye-off" : "eye"}
                size={24}
                color={colors.subText}
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPin && (
            <Text style={[styles.error, { color: colors.error }]}>
              {errors.confirmPin.message}
            </Text>
          )}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.button },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>SUBMIT</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Full screen overlay loader (optional) */}
      {isLoading && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <ActivityIndicator size="large" color={colors.button} />
            <Text style={[styles.overlayText, { color: colors.text }]}>
              Changing PIN...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: -15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 6,
  },
  card: {
    width: "90%",
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    marginBottom: 30,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    paddingRight: 48,
  },
  error: {
    fontSize: 13,
    marginBottom: 10,
  },
  button: {
    width: "90%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  overlayText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
  },
});