// components/modal/dmt/dmtLogin.tsx

import React, {  useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { FetchAccountDetailsApi } from "@/hooks/servies/quickTransferApi";



const COLORS = {
  light: {
    primary: "#350083",
    secondary: "#350083",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
    background: "#F9FAFB",
    card: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
  },
  dark: {
    primary: "#818CF8",
    secondary: "#A78BFA",
    success: "#34D399",
    warning: "#FBBF24",
    danger: "#F87171",
    info: "#60A5FA",
    background: "#111827",
    card: "#1F2937",
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    border: "#374151",
  },
};

// Validation Schema
const loginSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be 10 digits")
    .max(10, "Phone number must be 10 digits")
    .regex(/^[0-9]+$/, "Only numbers allowed"),
});

type LoginFormType = z.infer<typeof loginSchema>;

interface DMTLoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function QTLoginModal({ visible, onClose }: DMTLoginModalProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);


  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? COLORS.dark : COLORS.light;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
  });

  const handleClose = () => {
    reset();
    onClose();
  };


  const onSubmit = async (payload: LoginFormType) => {
    try {
      setLoading(true);
      await AsyncStorage.setItem("mobile", JSON.stringify(payload));
      const res = await FetchAccountDetailsApi(payload.phone);

      if(res?.status === "SUCCESS"){
         router.push('/screen/collection/quickTransfer')
          handleClose();
      }else{
        Alert.alert(res?.status, res?.message)
      }      
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={handleClose}>
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>

        {/* Loader */}
        {loading && (
          <View style={styles.loaderContainer}>
            <View style={[styles.loaderContent, { backgroundColor: theme.card }]}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loaderText, { color: theme.text }]}>Processing...</Text>
            </View>
          </View>
        )}

        {/* Header */}
        <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.modalHeader}>
          
          <SafeAreaView style={styles.headerContent}>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderText}>Quick Transfer</Text>
          </SafeAreaView>
        </LinearGradient>

        {/* Content */}
        <View style={styles.modalContent}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Login</Text>

            <View style={[styles.modalDivider, { backgroundColor: theme.border }]} />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    placeholder="Mobile Number"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    maxLength={10}
                    value={value}
                    onChangeText={onChange}
                    editable={!loading}
                    style={[
                      styles.modalInput,
                      {
                        borderColor: errors.phone ? theme.danger : theme.border,
                        color: theme.text,
                        backgroundColor: theme.background,
                      },
                    ]}
                  />

                  {errors.phone && (
                    <Text style={[styles.modalErrorText, { color: theme.danger }]}>
                      {errors.phone.message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.modalLoginButton,
              { backgroundColor: loading ? theme.border : theme.primary },
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.modalLoginText}>
              {loading ? "PROCESSING..." : "LOGIN"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  } as ViewStyle,

  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1000,
  } as ViewStyle,

  loaderContent: {
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  } as ViewStyle,

  loaderText: {
    marginTop: 10,
    fontSize: 14,
  } as TextStyle,

  modalHeader: {
    paddingTop: 10,
    paddingBottom: 16,
  } as ViewStyle,

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical:15
  } as ViewStyle,

  modalHeaderText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  } as TextStyle,

  modalContent: {
    alignItems: "center",
    marginTop: 40,
  } as ViewStyle,

  modalCard: {
    width: "90%",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
  } as ViewStyle,

  modalTitle: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  } as TextStyle,

  modalDivider: {
    height: 1,
    marginVertical: 12,
  } as ViewStyle,

  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  } as TextStyle,

  modalErrorText: {
    fontSize: 12,
    marginTop: 6,
  } as TextStyle,

  modalLoginButton: {
    width: "90%",
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  } as ViewStyle,

  modalLoginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  } as TextStyle,
});