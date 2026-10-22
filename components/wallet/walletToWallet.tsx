import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import Constants from 'expo-constants';
import AsyncStorage from "@react-native-async-storage/async-storage";

const walletSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .regex(/^[0-9]+$/, "Phone must contain only numbers"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be greater than 0",
    }),
});

export default function WalletToWallet() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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

  const [selectedUserName, setSelectedUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const baseURL = Constants.expoConfig?.extra?.API_URL;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      phone: "",
      name: "",
      amount: "",
    },
  });

  const phoneValue = watch("phone");

  const getUser = async (phoneNumber: any) => {
    // Only fetch when phone number is exactly 10 digits
    if (phoneNumber.length !== 10) {
      return;
    }

    setIsLoading(true);
    try {
      const datas = await AsyncStorage.getItem('user');
      const keydata = JSON.parse(datas as any);
      const payload = {
        phone: phoneNumber
      }

      const res = await fetch(`${baseURL}/api/wallet-to-wallet/fetch-by-number`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "headerKey": keydata.header_key,
          "headerToken": keydata.header_token,
        },
      });

      const data = await res.json();

      if (data?.status === "SUCCESS") {
        Alert.alert(`${data?.status}`, `${data?.message}`)
        setValue('name', data?.data?.WalletFetchUser?.name)
        setSelectedUserName(data?.data?.WalletFetchUser?.name)
      } else {
        Alert.alert(`${data?.status}`, `${data?.message}`)
      }


    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true)
      const submissionData = { ...data };

      const payload = {
        phone: data?.phone,
        amount: submissionData?.amount,
      };

      const datas = await AsyncStorage.getItem("user");

      if (!datas) {
        throw new Error("Authentication keys not found.");
      }

      const keydata = JSON.parse(datas as any);

      const res = await fetch(`${baseURL}/api/wallet-to-wallet/do-transactions`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "headerKey": keydata.header_key,
          "headerToken": keydata.header_token,
        },
      });
      const resData = await res.json()
      if (resData?.status === "SUCCESS") {
        Alert.alert(`${resData?.status}`, `${resData?.message}`);
        reset();
      } else {
        Alert.alert(`${resData?.status}`, `${resData?.message}`);
      }

    } catch {
      Alert.alert("Transation field", "somethin went wroung");
    } finally {
      setIsLoading(false)
    }
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      paddingTop: 30,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 25,
      textAlign: "center",
      color: colors.text,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 8,
      paddingHorizontal: 10,
      marginBottom: 5,
      backgroundColor: colors.card,
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 10,
      fontSize: 16,
      color: colors.text,
    },
    autoFilledInput: {
      color: colors.button,
      fontWeight: "500",
    },
    loadingIcon: {
      marginLeft: 5,
    },
    error: {
      color: colors.error,
      marginBottom: 10,
      fontSize: 12,
      marginLeft: 5,
    },
    button: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.button,
      paddingVertical: 14,
      borderRadius: 8,
      marginTop: 20,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    userInfoContainer: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 8,
      marginTop: 10,
      marginBottom: 5,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    userInfoText: {
      color: colors.button,
      fontSize: 14,
      fontWeight: "500",
    },
    userNotFound: {
      backgroundColor: colors.card,
      borderColor: colors.error,
    },
    userNotFoundText: {
      color: colors.error,
      fontSize: 14,
      fontWeight: "500",
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Wallet to Wallet Transfer</Text>

      {/* Phone */}
      <View style={styles.inputContainer}>
        <Ionicons name="call-outline" size={20} color={colors.subText} />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor={colors.subText}
              keyboardType="numeric"
              style={styles.input}
              value={value}
              onChangeText={(text) => {
                onChange(text);
                // Call getUser with the current text value directly
                if (text.length === 10) {
                  getUser(text);
                } else if (text.length < 10) {
                  // Clear name and selected user if phone number is less than 10 digits
                  setValue("name", "");
                }
              }}
              maxLength={10}
            />
          )}
        />
        {isLoading && (
          <Ionicons name="refresh-outline" size={20} color={colors.subText} style={styles.loadingIcon} />
        )}
      </View>
      {errors.phone && (
        <Text style={styles.error}>{errors.phone.message}</Text>
      )}

      {/* Name - Auto-filled but editable */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color={colors.subText} />
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Name"
              placeholderTextColor={colors.subText}
              style={[styles.input, value ? styles.autoFilledInput : null]}
              value={value}
              onChangeText={onChange}
              editable={false}
            />
          )}
        />
        {selectedUserName && (
          <Ionicons name="checkmark-circle" size={20} color="green" />
        )}
      </View>
      {errors.name && <Text style={styles.error}>{errors.name.message}</Text>}

      {/* Amount */}
      <View style={styles.inputContainer}>
        <Ionicons name="cash-outline" size={20} color={colors.subText} />
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Amount"
              placeholderTextColor={colors.subText}
              keyboardType="numeric"
              style={styles.input}
              value={value}
              onChangeText={onChange}
            />
          )}
        />
      </View>
      {errors.amount && (
        <Text style={styles.error}>{errors.amount.message}</Text>
      )}


      {!selectedUserName && phoneValue.length === 10 && !isLoading && (
        <View style={[styles.userInfoContainer, styles.userNotFound]}>
          <Text style={styles.userNotFoundText}>
            ✗ No user found with this phone number
          </Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.button, (!selectedUserName || isLoading) && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={!selectedUserName || isLoading}
      >
        <Ionicons name="send-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}> {isLoading ? "Processing......" : "Send Money"}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}