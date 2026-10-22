import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { accountVerify, getAllBankIfscApi } from "@/hooks/servies/quickTransferApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

const verificationSchema = z.object({
  accountNumber: z
    .string()
    .min(6, "Account number is too short")
    .max(18, "Account number is too long"),
  bankName: z.string().min(1, "Please select a bank"),
  ifscCode: z
    .string()
    .min(11, "IFSC code must be 11 characters")
    .max(11, "IFSC code must be 11 characters"),
  name: z.string().min(1, "Name is required"),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

interface BankIFSC {
  id: number;
  name: string;
  ifscGlobal: string;
}

interface AccountVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerifySuccess: () => void;
  theme: any;
  isDark: boolean;
  getLocation: any;
}

export default function AccountVerificationModal({
  visible,
  onClose,
  onVerifySuccess,
  theme,
  isDark,
  getLocation,
}: AccountVerificationModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankData, setBankData] = useState<BankIFSC[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVerifyingName, setIsVerifyingName] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues,
    reset
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      accountNumber: "",
      bankName: "",
      ifscCode: "",
      name: "",
    },
  });

  const handleBankInput = async () => {
    setIsLoadingBanks(true);
    setBankModalVisible(true);
    try {
      const res = await getAllBankIfscApi();
      if (res?.data?.globalList && Array.isArray(res.data.globalList)) {
        setBankData(res.data.globalList);
      } else {
        setBankData([]);
      }
    } catch {
      Alert.alert("Error", "Failed to load bank data");
      setBankData([]);
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const handleSelectBank = (bank: BankIFSC) => {
    setValue("bankName", bank.name, { shouldValidate: true });
    setValue("ifscCode", bank.ifscGlobal, { shouldValidate: true });
    setBankModalVisible(false);
    setSearchQuery("");
  };

  const handleVerifyName = async () => {
    const accountNumber = getValues("accountNumber");
    const ifscCode = getValues("ifscCode");
    const bankName = getValues("bankName");

    // Validate required fields
    if (!accountNumber) {
      Alert.alert("Error", "Please enter account number first");
      return;
    }
    if (!ifscCode || !bankName) {
      Alert.alert("Error", "Please select a bank first");
      return;
    }

    setIsVerifyingName(true);
    try {
      if (!getLocation?.latitude) {
        Alert.alert("Warning", "Please turn on location");
      }

      const MobileData = JSON.parse(await AsyncStorage.getItem('mobile') as any)
 
      const payload = {
        account: accountNumber,
        ifsc: ifscCode,
        mobile: MobileData.phone,
        lat: getLocation?.latitude,
        log: getLocation?.longitude,
      };
      
      console.log("Verify Name Payload:", payload);
      
      const res: any = await accountVerify(payload);
      if (res?.status === "SUCCESS") {
        setValue('name', res?.name || res?.bname, { shouldValidate: true });
      } else {
        Alert.alert("Error", res?.message || "Account verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      Alert.alert("Error", "Failed to verify account holder name");
    } finally {
      setIsVerifyingName(false);
    }
  };

  const onSubmit = async (data: VerificationFormData) => {
    setIsVerifying(true);
    try {
      if (!getLocation?.latitude) {
        Alert.alert("Warning", "Please turn on location");
      }

      const MobileData = JSON.parse(await AsyncStorage.getItem('mobile') as any)
 
      const payload = {
        account: data.accountNumber,
        ifsc: data.ifscCode,
        mobile: MobileData.phone,
        lat: getLocation?.latitude,
        log: getLocation?.longitude,
      };
      console.log("Payload being sent:", payload);
      
      const res: any = await accountVerify(payload);
      if (res?.status === "SUCCESS") {
        Alert.alert(res?.status, res?.message);
        onVerifySuccess();
        reset();
      } else {
        Alert.alert("Error", res?.message || "Account verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      Alert.alert("Error", "Account verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredBanks = bankData.filter((bank) => {
    const bankName = bank.name || "";
    const ifscCode = bank.ifscGlobal || "";
    const query = searchQuery.toLowerCase().trim();
    if (query === "") return true;
    return (
      bankName.toLowerCase().includes(query) ||
      ifscCode.toLowerCase().includes(query)
    );
  });

  const renderBankItem = ({ item }: { item: BankIFSC }) => (
    <TouchableOpacity
      style={[
        styles.bankItem,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
      onPress={() => handleSelectBank(item)}
      activeOpacity={0.7}
    >
      <View style={styles.bankItemContent}>
        <View style={[styles.bankIcon, { backgroundColor: theme.primary }]}>
          <FontAwesome name="bank" size={16} color={theme.text} />
        </View>
        <View style={styles.bankItemDetails}>
          <Text
            style={[
              styles.bankName,
              { color: isDark ? theme.text : "#000000" },
            ]}
            numberOfLines={1}
          >
            {item.name || "Unknown Bank"}
          </Text>
          <Text style={[styles.bankIfsc, { color: theme.primary }]}>
            IFSC: {item.ifscGlobal || "N/A"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderBankField = () => (
    <Controller
      control={control}
      name="bankName"
      render={({ field: { value } }) => (
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <FontAwesome
              name="bank"
              size={16}
              color={theme.label}
              style={styles.inputIcon}
            />
            <Text style={[styles.label, { color: theme.label }]}>
              Bank Name
            </Text>
          </View>
          <TouchableOpacity 
            onPress={handleBankInput}
            activeOpacity={0.7}
          >
            <View pointerEvents="none">
              <TextInput
                placeholder="Select Bank"
                placeholderTextColor={theme.label}
                value={value}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: errors.bankName ? theme.error : theme.border,
                    color: isDark ? theme.text : "#000000",
                  },
                  errors.bankName && styles.errorBorder,
                  styles.bankInput,
                ]}
                editable={false}
              />
              <View style={styles.dropdownIcon}>
                <Ionicons name="chevron-down" size={20} color={theme.label} />
              </View>
            </View>
          </TouchableOpacity>
          {errors.bankName && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={16} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>
                {errors.bankName?.message}
              </Text>
            </View>
          )}
        </View>
      )}
    />
  );

  // Updated renderInput with verify button for name field
  const renderInput = (
    name: keyof VerificationFormData,
    placeholder: string,
    icon: keyof typeof FontAwesome.glyphMap,
    options: any = {}
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <FontAwesome
              name={icon}
              size={16}
              color={theme.label}
              style={styles.inputIcon}
            />
            <Text style={[styles.label, { color: theme.label }]}>
              {placeholder}
            </Text>
          </View>
          
          {/* Special layout for Account Holder Name with Verify Button */}
          {name === "name" ? (
            <View style={styles.nameInputContainer}>
              <TextInput
                placeholder={`Enter ${placeholder.toLowerCase()}`}
                placeholderTextColor={theme.label}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: errors[name] ? theme.error : theme.border,
                    color: isDark ? theme.text : "#000000",
                  },
                  errors[name] && styles.errorBorder,
                ]}
                autoCorrect={false}
                editable={false}
                {...options}
              />
              <TouchableOpacity
                style={[styles.verifyButton, { backgroundColor: theme.primary }]}
                onPress={handleVerifyName}
                disabled={isVerifyingName}
                activeOpacity={0.7}
              >
                {isVerifyingName ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <FontAwesome name="check" size={14} color="#FFFFFF" />
                    <Text style={styles.verifyButtonText}>Verify</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TextInput
              placeholder={`Enter ${placeholder.toLowerCase()}`}
              placeholderTextColor={theme.label}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: errors[name] ? theme.error : theme.border,
                  color: isDark ? theme.text : "#000000",
                },
                errors[name] && styles.errorBorder,
              ]}
              autoCorrect={false}
              {...options}
            />
          )}
          
          {errors[name] && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={16} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>
                {errors[name]?.message}
              </Text>
            </View>
          )}
        </View>
      )}
    />
  );

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <LinearGradient
                colors={[theme.gradientStart, theme.gradientEnd]}
                style={styles.modalHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.modalHeaderContent}>
                  <FontAwesome name="shield" size={24} color={theme.text} />
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Add New Account
                  </Text>
                  <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalSubtitle, { color: theme.text }]}>
                  Enter account details for verification
                </Text>
              </LinearGradient>

              <ScrollView
                contentContainerStyle={styles.modalList}
                showsVerticalScrollIndicator={false}
              >
                {renderInput("accountNumber", "Account Number", "credit-card")}
                
                {renderBankField()}
                
                {renderInput("ifscCode", "IFSC Code", "barcode", {
                  autoCapitalize: "characters",
                  maxLength: 14,
                })}
                
                {renderInput("name", "Account Holder Name", "user")}

                <TouchableOpacity
                  style={[styles.submitButton, { shadowColor: theme.primary }]}
                  onPress={handleSubmit(onSubmit)}
                  disabled={isVerifying}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[theme.gradientStart, theme.gradientEnd]}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isVerifying ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={theme.text} />
                        <Text style={[styles.buttonText, { color: theme.text }]}>
                          Verifying...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <FontAwesome name="shield" size={20} color={theme.text} />
                        <Text style={[styles.buttonText, { color: theme.text }]}>
                          ADD ACCOUNT
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelButton, { borderTopColor: theme.border }]}
                  onPress={onClose}
                >
                  <Text style={[styles.cancelText, { color: theme.label }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bank Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={bankModalVisible}
        onRequestClose={() => {
          setBankModalVisible(false);
          setSearchQuery("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <LinearGradient
              colors={[theme.gradientStart, theme.gradientEnd]}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.modalHeaderContent}>
                <FontAwesome name="bank" size={24} color={theme.text} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Select Bank
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setBankModalVisible(false);
                    setSearchQuery("");
                  }}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.text} style={styles.searchIcon} />
                <TextInput
                  placeholder="Search bank or IFSC..."
                  placeholderTextColor={theme.text + "80"}
                  style={[styles.searchInput, { color: theme.text }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color={theme.text} />
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>

            {isLoadingBanks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.label }]}>Loading banks...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredBanks}
                keyExtractor={(item: any) => item?.id?.toString() || Math.random().toString()}
                renderItem={renderBankItem}
                contentContainerStyle={styles.modalList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <FontAwesome name="bank" size={50} color={theme.label} />
                    <Text style={[styles.emptyText, { color: theme.label }]}>
                      {searchQuery ? "No matching banks found" : "No banks available"}
                    </Text>
                  </View>
                }
              />
            )}

            <TouchableOpacity
              style={[styles.modalCancelButton, { borderTopColor: theme.border }]}
              onPress={() => {
                setBankModalVisible(false);
                setSearchQuery("");
              }}
            >
              <Text style={[styles.modalCancelText, { color: theme.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginLeft: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.9,
    marginLeft: 34,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalList: {
    padding: 20,
    paddingBottom: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputIcon: {
    width: 20,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1.5,
    fontWeight: "500",
  },
  bankInput: {
    paddingRight: 40,
  },
  dropdownIcon: {
    position: "absolute",
    right: 12,
    top: 18,
  },
  errorBorder: {
    borderWidth: 1.5,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelButton: {
    padding: 16,
    marginTop: 10,
    alignItems: "center",
    borderTopWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  bankItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bankItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bankItemDetails: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  bankIfsc: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
  },
  modalCancelButton: {
    padding: 16,
    marginBottom: 60,
    alignItems: "center",
    borderTopWidth: 1,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 14,
    marginTop: 10,
  },
  // New styles for name input with verify button
  nameInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nameInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1.5,
    fontWeight: "500",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});