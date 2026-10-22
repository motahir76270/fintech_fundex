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

import { passwordChangeApiCall } from "@/hooks/authApi/forgetPasswordApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useCompany } from "@/constants/string";
import HeaderSection from "@/components/navbar/header";

/* ---------------- ZOD SCHEMA ---------------- */
const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(6, "Old password must be at least 6 characters"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword !== data.oldPassword, {
    message: "New password must be different from old password",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === "dark";
  const company = useCompany();

  // State for password visibility
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (datas: ChangePasswordForm) => {
    const payload = {
      current_password: datas?.oldPassword,
      new_password: datas?.newPassword,
    };

    setIsLoading(true); // Show loading indicator

    try {
      const data = await passwordChangeApiCall(payload);
      if (data?.status === "SUCCESS") {
        Alert.alert(`${data?.status}`, `${data?.message}`);
        router.replace("/(tabs)");
      } else {
        Alert.alert(`${data.status}`, `${data?.message}`);
      }
    } catch (error: any) {
      Alert.alert("ERROR", `${error}`);
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
          <HeaderSection title="Password Change" />
      

      {/* Body */}
      <View style={styles.body}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={company.logo}
            style={{ width: 112, height: 82, borderRadius: 18 }}
          />
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Old Password */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="oldPassword"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Old Password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showOldPassword}
                  value={value}
                  onChangeText={onChange}
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
              onPress={() => setShowOldPassword(!showOldPassword)}
              disabled={isLoading}
            >
              <Ionicons
                name={showOldPassword ? "eye-off" : "eye"}
                size={24}
                color={colors.subText}
              />
            </TouchableOpacity>
          </View>
          {errors.oldPassword && (
            <Text style={[styles.error, { color: colors.error }]}>
              {errors.oldPassword.message}
            </Text>
          )}

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="New Password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showNewPassword}
                  value={value}
                  onChangeText={onChange}
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
              onPress={() => setShowNewPassword(!showNewPassword)}
              disabled={isLoading}
            >
              <Ionicons
                name={showNewPassword ? "eye-off" : "eye"}
                size={24}
                color={colors.subText}
              />
            </TouchableOpacity>
          </View>
          {errors.newPassword && (
            <Text style={[styles.error, { color: colors.error }]}>
              {errors.newPassword.message}
            </Text>
          )}

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showConfirmPassword}
                  value={value}
                  onChangeText={onChange}
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
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={24}
                color={colors.subText}
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={[styles.error, { color: colors.error }]}>
              {errors.confirmPassword.message}
            </Text>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.button },
            isLoading && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitText}>SUBMIT</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Full screen overlay loader (optional) */}
      {isLoading && (
        <View style={styles.overlay}>
          <View style={[styles.overlayContent, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.button} />
            <Text style={[styles.overlayText, { color: colors.text }]}>
              Changing Password...
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
    paddingTop: 10,
    paddingBottom: -10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
  },
  body: {
    alignItems: "center",
    paddingTop: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 26,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 6,
  },
  card: {
    width: "90%",
    borderRadius: 14,
    padding: 18,
    elevation: 5,
    marginBottom: 32,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    paddingRight: 48,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  error: {
    fontSize: 13,
    marginBottom: 10,
  },
  submitBtn: {
    width: "90%",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
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