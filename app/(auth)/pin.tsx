import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { Login_varify_btn } from "@/hooks/authApi/authapi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ForgetPinModal from "@/components/modal/ForgetPinModal";

const { width } = Dimensions.get("window");

// Validation schema
const pinSchema = z.object({
  pin: z
    .string()
    .min(4, { message: "PIN must be at least 4 digits" })
    .max(4, { message: "PIN must be at most 4 digits" })
    .regex(/^\d+$/, { message: "PIN must contain only numbers" }),
});

type PinFormData = z.infer<typeof pinSchema>;

export default function PinLoginScreen() {
  const colorScheme = useColorScheme();
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgetPin, setShowForgetPin] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  
  // Setup form
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset
  } = useForm<PinFormData>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: "" },
    mode: "onChange",
  });

  const pinValue = watch("pin");

  // Colors
  const colors =
    colorScheme === "light"
      ? {
          background: "#fff",
          card: "#eeeaea",
          input: "#d6d2d2",
          primary: "#350083",
          text: "#350083",
          subText: "#350083",
          error: "#ff3b30",
          success: "#34c759",
        }
      : {
          background: "#01090d",
          card: "#02232f",
          input: "#022733",
          primary: "#4fc3f7",
          text: "#ffffff",
          subText: "#b0bec5",
          error: "#ff453a",
          success: "#30d158",
        };

  // Handle login
  const handleLogin = async (data: PinFormData) => {
    const keydata = JSON.parse(await AsyncStorage.getItem("keysdata") || "null");
    const payload = {
      log_key: keydata.log_key,
      otp: data.pin
    }
    
    setIsLoading(true);
    const res = await Login_varify_btn(payload, dispatch, router);
    if(res){
      setIsLoading(false);
      reset();
    } else {
      setIsLoading(false);
    }
  };

  // Forgot PIN
  const handleForgotPin = () => {
    setShowForgetPin(true);
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Back Button */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={'#fff'} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
            <Text style={{ color: colors.background ,fontSize:20}}> Login Varify </Text>
        </View>
        <View style={styles.placeholder} />
      </View>
      
      {/* Title Section */}
      <View style={styles.titleSection}>
         <View style={[styles.logo, { backgroundColor: colors.text }]}>
            <Ionicons name="lock-closed" size={32} color={colors.background} />
          </View>
        <Text style={[styles.title, { color: colors.text }]}>Secure Login</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>Enter your PIN</Text>
      </View>

      {/* Form */}
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* PIN Input */}
          <View>
            <View style={[
              styles.inputContainer,
              { backgroundColor: colors.input },
              errors.pin && { borderColor: colors.error, borderWidth: 1 }
            ]}>
              <Ionicons name="key-outline" size={24} color={colors.primary} />
              <Controller
                control={control}
                name="pin"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Enter PIN"
                    placeholderTextColor={colors.subText}
                    style={[styles.input, { color: colors.text }]}
                    secureTextEntry={!showPin}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={value}
                    onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ""))}
                    editable={!isLoading}
                  />
                )}
              />
              <TouchableOpacity onPress={() => setShowPin(!showPin)}>
                <Ionicons
                  name={showPin ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
            {errors.pin && (
              <Text style={[styles.error, { color: colors.error }]}>
                {errors.pin.message}
              </Text>
            )}
          </View>

          {/* PIN Dots */}
          <View style={styles.dots}>
            {[1, 2, 3, 4].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: colors.input },
                  i < pinValue.length && { backgroundColor: colors.primary }
                ]}
              />
            ))}
          </View>

          {/* Forgot PIN */}
          <TouchableOpacity onPress={handleForgotPin} style={styles.forgot}>
            <Text style={{ color: colors.primary }}>Forgot PIN?</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              (!isValid || isLoading) && { opacity: 0.5 }
            ]}
            onPress={handleSubmit(handleLogin)}
            disabled={!isValid || isLoading}
          >
              <Text style={styles.buttonText}>Verify PIN</Text>
          </TouchableOpacity>

          {/* Security Message */}
          <View style={styles.security}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
            <Text style={[styles.securityText, { color: colors.subText }]}>
              Your PIN is secure
            </Text>
          </View>
        </View>
      </View>

      <ForgetPinModal
        visible={showForgetPin}
        onClose={() => setShowForgetPin(false)}
      />

      {/* Fullscreen Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Verifying PIN...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    zIndex: 1,
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    width: 40,
  },
  titleSection: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 10,
    paddingVertical: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    width: width * 0.9,
    borderRadius: 20,
    padding: 24,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: "center",
  },
  error: {
    fontSize: 12,
    marginLeft: 4,
    marginBottom: 12,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  forgot: {
    alignSelf: "center",
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  security: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  securityText: {
    marginLeft: 6,
    fontSize: 12,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
});