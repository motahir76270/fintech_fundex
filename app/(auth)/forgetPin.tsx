import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Constants from "expo-constants";
import { useSelector } from "react-redux";
import axios from "axios";
import { router } from "expo-router";

// =======================
// ZOD SCHEMA
// =======================
const resetPasswordSchema = z
  .object({
    otp: z
      .string()
      .regex(/^\d{4,6}$/, "OTP must be 4 to 6 digits"), // ✅ 4-6 digits
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

// =======================
// COMPONENT
// =======================
const ForgetPin = () => {
  const baseURL = Constants.expoConfig?.extra?.API_URL;

  // ⚠️ Make sure your redux slice name is correct (forgetPasword?)
  const forgetpswd_data = useSelector(
    (state: any) => state.auth?.forgetPasword
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      const payload = {
        key: forgetpswd_data?.key,
        otp: data.otp,
        password: data.newPassword,
      };

      const res = await axios.post(
        `${baseURL}/api/set_password`,
        payload
      );

      if(res.data){
        // console.log(res.data);
        Alert.alert("Success", "Password reset successfully!");
        router.push('/(auth)/login');
      }
    } catch (error: any) {
      console.log(error?.response?.data || error.message);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>

        {/* OTP */}
        <Controller
          control={control}
          name="otp"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Enter OTP (4-6 digits)"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              maxLength={6} // ✅ max 6 digits
            />
          )}
        />
        {errors.otp && (
          <Text style={styles.error}>{errors.otp.message}</Text>
        )}

        {/* New Password */}
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry
            />
          )}
        />
        {errors.newPassword && (
          <Text style={styles.error}>
            {errors.newPassword.message}
          </Text>
        )}

        {/* Confirm Password */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry
            />
          )}
        />
        {errors.confirmPassword && (
          <Text style={styles.error}>
            {errors.confirmPassword.message}
          </Text>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.button,
            (!isValid || isSubmitting) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? "Processing..." : "Reset Password"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgetPin;

// =======================
// STYLES
// =======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 6,
  },
  error: {
    color: "#ff4d4f",
    fontSize: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#aaa",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
