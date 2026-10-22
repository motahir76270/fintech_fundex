import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

/* ---------------- Schema ---------------- */
const loginSchema = z.object({
  mobile: z
    .string()
    .min(10, "Mobile number must be 10 digits")
    .max(10, "Mobile number must be 10 digits")
    .regex(/^[0-9]+$/, "Only numbers allowed"),
});

type LoginFormType = z.infer<typeof loginSchema>;

export default function DmtLoginScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    background: isDark ? "#021a22" : "#E6F1F6",
    header: isDark ? "#032834" : "#260c9e",
    card: isDark ? "#0f2b33" : "#ffffff",
    text: isDark ? "#ffffff" : "#000000",
    border: isDark ? "#2f4f58" : "#D0D0D0",
    placeholder: "#9ca3af",
    error: isDark ? "#CF6679" : "#D32F2F",
    button: isDark ? "#0b4a5a" : "#350083",
    divider: isDark ? "#2f4f58" : "#CFE3EE",
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormType) => {
    console.log("Login Data:", data);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    
      {/* Header */}
      <SafeAreaView style={[styles.header, { backgroundColor: colors.header }]}>
        <TouchableOpacity onPress={ ()=> router.back() }>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={{color:'white',fontSize:20}}> Money Transfer</Text>
      </SafeAreaView>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            DMT Login
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Mobile Input */}
          <Controller
            control={control}
            name="mobile"
            render={({ field: { onChange, value } }) => (
              <>
                <TextInput
                  placeholder="Mobile Number"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  maxLength={10}
                  value={value}
                  onChangeText={onChange}
                  style={[
                    styles.input,
                    {
                      borderColor: errors.mobile
                        ? colors.error
                        : colors.border,
                      color: colors.text,
                    },
                  ]}
                />
                {errors.mobile && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.mobile.message}
                  </Text>
                )}
              </>
            )}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.button }]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.loginText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection:'row',
    justifyContent: 'flex-start',
    gap:20,
    paddingHorizontal: 16,
    paddingTop:20,
    paddingBottom:-10

  },

  content: {
    alignItems: "center",
    marginTop: 40,
  },

  card: {
    width: "90%",
    borderRadius: 12,
    padding: 20,
    elevation: 4,
  },

  title: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    marginVertical: 12,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
  },

  errorText: {
    fontSize: 12,
    marginTop: 6,
  },

  loginButton: {
    width: "90%",
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
