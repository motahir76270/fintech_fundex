import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";

// React Hook Form & Zod
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCompany } from "@/constants/string";

/* -------------------- TypeScript Types -------------------- */
type Package = {
  id: number;
  code: string;
  name: string;
  level: number;
  rid: number;
  created_at: string;
  updated_at: string;
};

type FormData = {
  username: string;
  mobile: string;
  email: string;
  state: Package | null;
  terms: boolean;
};

/* -------------------- Zod Schema -------------------- */
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  mobile: z
    .string()
    .regex(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  email: z.string().email("Invalid email address"),
  state: z.object({
    id: z.number(),
    name: z.string(),
    code: z.string().optional(),
    level: z.number().optional(),
    rid: z.number().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  }),
  terms: z.boolean().refine((v) => v === true, "You must accept terms"),
});

/* -------------------- Component -------------------- */
export default function CreateAccountScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const baseURL = Constants.expoConfig?.extra?.API_URL;
  const company = useCompany();

  const colors = {
    background: isDark ? "#133444" : "#f5f7fa",
    card: isDark ? "#02232f" : "#ffffff",
    text: isDark ? "#ffffff" : "#1f2937", // Fixed: Dark text for light mode
    textLight: isDark ? "#9ca3af" : "#6b7280", // For secondary text
    inputBg: isDark ? "#1e2a3a" : "#f9fafb",
    border: isDark ? "#374151" : "#e5e7eb",
    primary: isDark ? "#0891b2" : "#350083",
    primaryDark: isDark ? "#0e7490" : "#5b21b6",
    error: "#ef4444",
  };

  /* -------------------- States -------------------- */
  const [states, setStates] = useState<any>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  /* -------------------- React Hook Form -------------------- */
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      mobile: "",
      email: "",
      state: null,
      terms: false,
    },
  });
  
  const selectedState = watch("state");

  /* -------------------- Fetch Data -------------------- */
  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${baseURL}/api/getRole`, {
        method: "GET"
      });
      const data = await res.json();
      
      if (data.status === "SUCCESS") {
        setStates(data.data.roles);
      } else {
        Alert.alert(data.status, data.message);
      }
    } catch  {
      Alert.alert("Error", "Failed to fetch states");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateRolebtn = async () => {
    await fetchPackages();
    setModalVisible(true);
  };

  /* -------------------- Submit Handler -------------------- */
  const onSubmit = async (datas: FormData) => {
    if (!datas.state) {
      Alert.alert("Error", "Please select a state");
      return;
    }
    
    setIsSubmitting(true);
    const payload = {
      email: datas.email,
      phone: datas.mobile,
      role: datas.state.id,
      name: datas.username,
    };
    
    try {
      const res = await fetch(`${baseURL}/api/register`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.status === "SUCCESS") {
        reset();
        Alert.alert(data.status, data.message);
        router.push('/(auth)/login')
      } else {
        Alert.alert(data.status, data.message);
      }
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -------------------- Handle Back -------------------- */
  const handleBack = () => {
    router.back();
  };

  /* -------------------- JSX -------------------- */
  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <SafeAreaView style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={28} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerLogoContainer}>
            <Text style={[styles.headerLogoText, { color: "#ffffff" }]}>{company.name}</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </SafeAreaView>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>Sign up to get started</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Username */}
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={22} color={colors.primary} />
                <TextInput
                  placeholder="Enter User Name"
                  placeholderTextColor={colors.textLight}
                  style={[styles.input, { color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isSubmitting}
                />
              </View>
            )}
          />
          {errors.username && <Text style={[styles.errorText, { color: colors.error }]}>{errors.username.message}</Text>}

          {/* Mobile */}
          <Controller
            control={control}
            name="mobile"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="call-outline" size={22} color={colors.primary} />
                <TextInput
                  placeholder="Enter Mobile Number"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textLight}
                  style={[styles.input, { color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isSubmitting}
                  maxLength={10}
                />
              </View>
            )}
          />
          {errors.mobile && <Text style={[styles.errorText, { color: colors.error }]}>{errors.mobile.message}</Text>}

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={22} color={colors.primary} />
                <TextInput
                  placeholder="Enter Email"
                  keyboardType="email-address"
                  placeholderTextColor={colors.textLight}
                  style={[styles.input, { color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isSubmitting}
                  autoCapitalize="none"
                />
              </View>
            )}
          />
          {errors.email && <Text style={[styles.errorText, { color: colors.error }]}>{errors.email.message}</Text>}

          {/* State Selection */}
          <TouchableOpacity
            style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            onPress={handleStateRolebtn}
            disabled={isLoading || isSubmitting}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={22} color={colors.primary} />
            <Text style={[styles.selectText, { color: selectedState ? colors.text : colors.textLight }]}>
              {selectedState ? selectedState.name : "Select State"}
            </Text>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="chevron-down" size={22} color={colors.textLight} />
            )}
          </TouchableOpacity>
          {errors.state && <Text style={[styles.errorText, { color: colors.error }]}>{errors.state.message}</Text>}

          {/* Modal for State Dropdown */}
          <Modal 
            visible={modalVisible} 
            transparent 
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Select State</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={states}
                  keyExtractor={(item, index) => index.toString()}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }: any) => (
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setValue("state", item);
                        setModalVisible(false);
                      }}
                    > 
                      <Text style={[styles.modalItemText, { color: colors.text }]}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          {/* Terms */}
          <Controller
            control={control}
            name="terms"
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => !isSubmitting && onChange(!value)}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    value && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  {value && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.termsText, { color: colors.textLight }]}>
                  I agree to the{" "}
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>
                    Terms of Services
                  </Text>{" "}
                  and{" "}
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
          />
          {errors.terms && <Text style={[styles.errorText, { color: colors.error }]}>{errors.terms.message}</Text>}

          {/* Button */}
          <TouchableOpacity
            disabled={!isValid || isSubmitting}
            activeOpacity={0.7}
            onPress={handleSubmit(onSubmit as any)}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.button, (!isValid || isSubmitting) && styles.buttonDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>SIGN UP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.textLight }]}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    alignItems: "center", 
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomEndRadius: 40,
    borderBottomStartRadius: 40,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLogoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogoText: {
    fontSize: 28,
    fontWeight: "600",
    marginLeft: 8,
  },
  headerPlaceholder: {
    width: 44,
  },
  card: { 
    width: "92%", 
    borderRadius: 22, 
    padding: 20, 
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginTop: 10,
    marginBottom: 20,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "700", 
    textAlign: "center" 
  },
  subtitle: { 
    textAlign: "center", 
    marginTop: 6,
    fontSize: 14,
  },
  divider: { 
    height: 1, 
    width: 80, 
    alignSelf: "center", 
    marginVertical: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  input: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 15,
    padding: 0,
  },
  selectText: { 
    flex: 1, 
    fontSize: 15,
    marginLeft: 10,
  },
  checkboxRow: { 
    flexDirection: "row", 
    alignItems: "flex-start", 
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  termsText: { 
    flex: 1, 
    fontSize: 13,
    lineHeight: 18,
  },
  button: { 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: "center", 
    marginTop: 16,
  },
  buttonDisabled: { 
    opacity: 0.6,
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700", 
    letterSpacing: 1,
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: "flex-end", 
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: { 
    maxHeight: "70%", 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20,
    paddingBottom: 80,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalItem: { 
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: { 
    fontSize: 12, 
    marginBottom: 8, 
    marginLeft: 12,
  },
});