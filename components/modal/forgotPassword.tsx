import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";

import { forgetPasswordApiCall } from "@/hooks/authApi/forgetPasswordApi";


interface Props {
  visible: boolean;
  onClose: () => void;
}

const forgetPasswordSchema = z.object({
  identifier: z
    .string()
    .min(3, "Email or username is required")
    .email("Enter a valid email")
    .or(z.string().min(3, "Username must be at least 3 characters")),
});

type ForgetPasswordForm = z.infer<typeof forgetPasswordSchema>;

export default function ForgetPasswordModal({ visible, onClose }: Props) {
  const dispatch = useDispatch();
    const [loading, setLoading] = useState(false)
  

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ForgetPasswordForm>({
    resolver: zodResolver(forgetPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async(datas: ForgetPasswordForm) => {
    setLoading(true)
    const res = await forgetPasswordApiCall(datas,dispatch)
     if(res?.status === "SUCCESS"){
      await setLoading(false);
      onClose();
      reset()
     }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Forgot Password</Text>

          <Controller
            control={control}
            name="identifier"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Enter registered email / username"
                style={[
                  styles.input,
                  errors.identifier && styles.inputError,
                ]}
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
              />
            )}
          />

          {errors.identifier && (
            <Text style={styles.errorText}>
              {errors.identifier.message}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              !isValid && styles.buttonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>{loading? "loading....." :"Send Reset Link"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
  },
  inputError: {
    borderColor: "#ff4d4f",
  },
  errorText: {
    color: "#ff4d4f",
    fontSize: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#350083",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#aaa",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  close: {
    marginTop: 16,
    textAlign: "center",
    color: "#555",
  },
});

