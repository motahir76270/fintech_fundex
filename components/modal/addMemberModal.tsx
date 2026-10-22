import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { setMember } from '@/redux/customer/cutomerSlice';
import { addMemberApiCall, getAllMemeber, getMemeberRole } from '@/hooks/servies/addMemberApi';
import { Ionicons } from '@expo/vector-icons';

// Schema for member validation - matches your original form
const addMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  state: z.string().min(2, "Role must be selected"),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

interface State {
  id: string;
  name: string;
  code?: string;
}

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onMemberAdded?: () => void;
}

const AddMemberModal = ({ visible, onClose, onMemberAdded }: AddMemberModalProps) => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [role, setRole] = useState('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue
  } = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      state: "",
    },
  });

  const selectedState = watch("state");

  const fetchStateRole = async () => {
    setLoadingStates(true);
    try {
      const res = await getMemeberRole();
      if (res.status === 'SUCCESS') {
        setStates(res.data.roles);
      }
    } catch  {
      Alert.alert("Error", "Failed to fetch roles");
    } finally {
      setLoadingStates(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchStateRole();
    }
  }, [visible]);

  const onSubmit = async (data: AddMemberFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: role
      }
      const res = await addMemberApiCall(payload);
      
      if(res?.status === "SUCCESS"){
        reset();
        setRole('');
        setShowStateDropdown(false);
        onClose();
        
        Alert.alert("Success", res.message || "Member added successfully");
        
        if (onMemberAdded) {
          onMemberAdded();
        } else {
          const memberRes = await getAllMemeber();
          if (memberRes?.status === "SUCCESS") {
            dispatch(setMember(memberRes?.data?.reportItems));
          }
        }
      } else {
        Alert.alert("Error", res?.message || "Failed to add member");
      }
    } catch (error: any) {
      Alert.alert("Failed", error?.message || error)
    } finally {
      setIsSubmitting(false)
    }
  };

  const selectState = (state: State) => {
    setValue("state", state.name);
    setRole(state.id);
    setShowStateDropdown(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setRole('');
      setShowStateDropdown(false);
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add New Member</Text>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Enter full name"
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={onChange}
                    editable={!isSubmitting}
                  />
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter email address"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    editable={!isSubmitting}
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Phone Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone *</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    placeholder="Enter 10-digit phone number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={value}
                    onChangeText={onChange}
                    editable={!isSubmitting}
                  />
                )}
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone.message}</Text>
              )}
            </View>

            {/* Role Field with Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role *</Text>
              <TouchableOpacity
                style={[styles.input, styles.roleSelector, errors.state && styles.inputError]}
                onPress={() => setShowStateDropdown(!showStateDropdown)}
                disabled={loadingStates || isSubmitting}
              >
                <Text style={[styles.roleText, !selectedState && styles.placeholderText]}>
                  {selectedState || (loadingStates ? "Loading roles..." : "Select Role")}
                </Text>
                <Ionicons 
                  name={showStateDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>

              {showStateDropdown && (
                <View style={styles.dropdown}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {states.length > 0 ? (
                      states.map((state) => (
                        <TouchableOpacity
                          key={state.id || state.name}
                          style={styles.dropdownItem}
                          onPress={() => selectState(state)}
                        >
                          <Text style={styles.dropdownItemText}>
                            {state.name}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.dropdownEmpty}>
                        <Text style={styles.dropdownEmptyText}>
                          No roles available
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

              {errors.state && (
                <Text style={styles.errorText}>{errors.state.message}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Add Member</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
    minHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  roleSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleText: {
    fontSize: 14,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    backgroundColor: "#fff",
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  dropdownEmpty: {
    padding: 20,
    alignItems: "center",
  },
  dropdownEmptyText: {
    fontSize: 14,
    color: "#999",
  },
  submitBtn: {
    backgroundColor: "#350083",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default AddMemberModal;