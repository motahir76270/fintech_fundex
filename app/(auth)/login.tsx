import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
  Alert,
  ActivityIndicator
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginStep1 } from "@/hooks/authApi/authapi";
import { useDispatch } from "react-redux";
import ForgetPasswordModal from "@/components/modal/forgotPassword";
import ForgetPinModal from "@/components/modal/ForgetPinModal";
import { Image } from "expo-image";
import { useCompany } from "@/constants/string";

const { width } = Dimensions.get("window");

// Define Zod validation schema
const loginSchema = z.object({
  phone: z
    .string()
    .min(10, { message: "phone must be at least 10 characters" })
    .max(10, { message: "phone must be less than 10 characters" })
    .regex(/^[0-9]+$/, {
      message: "phone can only contain numbers",
    }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(50, { message: "Password must be less than 50 characters" }),
});

// Infer TypeScript type from Zod schema
type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dispatch = useDispatch();
  const [showForgetPassword, setShowForgetPassword] = useState(false);
  const [showForgetPin, setShowForgetPin] = useState(false);
  const company = useCompany();
   

  // Initialize React Hook Form with Zod resolver
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
    mode: "onChange", // Validate on change
  });

  // Theme colors based on your palette
  const colors =
    colorScheme === "light"
      ? {
          background: "#fff",
          card: "#eeeaea",
          input: "#d6d2d2",
          inputError: "#ffebee",
          primary: "#350083",
          text: "#350083",
          subText: "#350083",
          icon: "#1e88e5",
          error: "#d32f2f",
          success: "#388e3c",
        }
      : {
          background: "#01090d",
          card: "#02232f",
          input: "#09536b",
          inputError: "#4a1c1c",
          primary: "#084357",
          text: "#ffffff",
          subText: "#b0bec5",
          icon: "#4fc3f7",
          error: "#ef5350",
          success: "#66bb6a",
        };

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {      
      // For demo purposes, simulate successful login
      setTimeout(() => {
        loginStep1(data,dispatch,router);
        setIsLoading(false);
      }, 2000);
    } catch {
      setIsLoading(false);
      Alert.alert("Error", "Login failed. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={[styles.header, { backgroundColor: colors.primary }]}>
        {/* <Text style={{ color: "#fff", fontSize: 30 }}>{company.name}</Text> */}
        <Image source={company.logo} style={styles.logo} />
      </SafeAreaView>

      {/* Logo */}
      <View style={styles.logoContainer}>
        {/* Add logo here if needed */}
      </View>

      {/* Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back!</Text>

        <Text style={[styles.subtitle, { color: colors.subText }]}>
          Sign in to continue your journey
        </Text>

        {/* phone Input */}
        <View>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.input },
              errors.phone && {
                backgroundColor: colors.inputError,
                borderWidth: 1,
                borderColor: colors.error,
              },
            ]}
          >
            <Ionicons name="person-outline" size={22} color={colors.icon} />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter phone"
                  placeholderTextColor={colors.subText}
                  style={[styles.input, { color: colors.text }]}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  editable={!isLoading}
                />
              )}
            />
          </View>
          {errors.phone && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.phone.message}
            </Text>
          )}
        </View>

        {/* Password Input */}
        <View>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.input },
              errors.password && {
                backgroundColor: colors.inputError,
                borderWidth: 1,
                borderColor: colors.error,
              },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={22} color={colors.icon} />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter password"
                  placeholderTextColor={colors.subText}
                  style={[styles.input, { color: colors.text }]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  editable={!isLoading}
                />
              )}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.subText}
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.password.message}
            </Text>
          )}
        </View>

        {/* Forgot Row */}
        <View style={styles.forgotRow}>
          <TouchableOpacity onPress={()=> setShowForgetPassword(true)}>
            <Text style={[styles.forgotText, { color: colors.text }]}>
              Forget Password ?
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setShowForgetPin(true)}>
            <Text style={[styles.forgotText, { color: colors.text }]}>
              Forget Pin ?
            </Text>
          </TouchableOpacity>
        </View>


        {/* Sign In Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            (!isValid || isLoading) && { opacity: 0.6 },
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isLoading}
        >
            <Text style={styles.buttonText}>SIGN IN</Text>
        </TouchableOpacity>

        {/* OR */}
        <Text style={[styles.orText, { color: colors.subText }]}>OR</Text>

        {/* Sign Up */}
        <Text style={[styles.signupText, { color: colors.subText }]}>
          Do not have an account ?{" "}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/signup")}
            disabled={isLoading}
          >
            <Text style={[styles.signupLink, { color: colors.text }]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </Text>
      </View>
      <ForgetPasswordModal
       visible={showForgetPassword}
        onClose={() => setShowForgetPassword(false)}
       />

   <ForgetPinModal
      visible={showForgetPin}
     onClose={() => setShowForgetPin(false)}
   />
   
   {/* Fullscreen Loading Overlay */}
   {isLoading && (
     <View style={styles.loadingOverlay}>
       <View style={styles.loadingContainer}>
         <ActivityIndicator size="large" color={colors.primary} />
         <Text style={[styles.loadingText, { color: colors.text }]}>
           Signing in...
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
    backgroundColor: "#350083",
    borderBottomEndRadius: 40,
    borderBottomStartRadius: 40,
    alignItems: "center",
    paddingVertical: 10,
  },
  logoContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  logo: {
    width: 200,
    height: 180, 
    borderRadius: 20,
  },
  card: {
    width: width * 0.9,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8, // Reduced for error text spacing
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 8,
  },
  forgotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  orText: {
    textAlign: "center",
    marginBottom: 16,
  },
  signupText: {
    textAlign: "center",
  },
  signupLink: {
    fontWeight: "600",
    top: 4,
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
    backgroundColor: "white",
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