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
import { getAllBankIfscApi } from "@/hooks/servies/quickTransferApi";

const transferSchema = z.object({
  bank: z.string().min(1, "Bank is required"),
  accountNumber: z
    .string()
    .min(6, "Account number is too short")
    .max(18, "Account number is too long")
    .regex(/^\d+$/, "Account number must be numeric"),
  ifscCode: z
    .string()
    .min(11, "IFSC code must be 11 characters")
    .max(11, "IFSC code must be 11 characters"),
  name: z.string().min(1, "Name is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
});

type TransferFormData = z.infer<typeof transferSchema>;

interface BankIFSC {
  id: number;
  name: string;
  ifscGlobal: string;
}

interface FetchedAccount {
  id: number;
  mobile: string;
  name: string;
  account: string;
  ifsc: string;
  bname: string;
  bid: number;
  upi: string | null;
  fetch_acc: number;
  date: string;
}

interface AccountTransferModalProps {
  visible: boolean;
  onClose: () => void;
  onTransfer: (data: TransferFormData) => void;
  theme: any;
  isDark: boolean;
  initialAccount?: FetchedAccount | null;
  getLocation: any;
}

export default function AccountTransferModal({
  visible,
  onClose,
  onTransfer,
  theme,
  isDark,
  initialAccount,
}: AccountTransferModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankData, setBankData] = useState<BankIFSC[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      bank: initialAccount?.bname || "",
      accountNumber: initialAccount?.account || "",
      ifscCode: initialAccount?.ifsc || "",
      name: initialAccount?.name || "",
      amount: "",
    },
  });

  React.useEffect(() => {
    if (initialAccount) {
      reset({
        bank: initialAccount.bname,
        accountNumber: initialAccount.account,
        ifscCode: initialAccount.ifsc,
        name: initialAccount.name,
        amount: "",
      });
    }
  }, [initialAccount, reset]);

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
    setValue("ifscCode", bank.ifscGlobal);
    setValue("bank", bank.name);
    setBankModalVisible(false);
    setSearchQuery("");
  };

  const onSubmit = async (data: TransferFormData) => {
    setIsProcessing(true);
    await onTransfer(data);
    setIsProcessing(false);
    onClose();
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

  const renderInput = (
    name: keyof TransferFormData,
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
          {name === "bank" ? (
            <TouchableOpacity onPress={handleBankInput}>
              <View pointerEvents="none">
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
                    styles.bankInput,
                  ]}
                  autoCorrect={false}
                  editable={false}
                  {...options}
                />
                <View style={styles.dropdownIcon}>
                  <Ionicons name="chevron-down" size={20} color={theme.label} />
                </View>
              </View>
            </TouchableOpacity>
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
                  <FontAwesome name="send" size={24} color={theme.text} />
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Transfer Money
                  </Text>
                  <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalSubtitle, { color: theme.text }]}>
                  Enter transfer details
                </Text>
              </LinearGradient>

              <ScrollView
                contentContainerStyle={styles.modalList}
                showsVerticalScrollIndicator={false}
              >
                {renderInput("bank", "Bank Name", "bank")}
                {renderInput("accountNumber", "Account Number", "credit-card", {
                  keyboardType: "number-pad",
                })}
                {renderInput("ifscCode", "IFSC Code", "barcode", {
                  autoCapitalize: "characters",
                  maxLength: 11,
                })}
                {renderInput("name", "Recipient Name", "user")}

                {/* Amount Input */}
                <Controller
                  control={control}
                  name="amount"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <View style={styles.labelContainer}>
                        <FontAwesome
                          name="money"
                          size={16}
                          color={theme.label}
                          style={styles.inputIcon}
                        />
                        <Text style={[styles.label, { color: theme.label }]}>
                          Amount
                        </Text>
                      </View>
                      <View style={styles.amountContainer}>
                        <View
                          style={[
                            styles.currencySymbol,
                            {
                              backgroundColor: theme.inputBg,
                              borderColor: errors.amount
                                ? theme.error
                                : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.currencyText,
                              { color: theme.primary },
                            ]}
                          >
                            ₹
                          </Text>
                        </View>
                        <TextInput
                          placeholder="Enter amount"
                          placeholderTextColor={theme.label}
                          keyboardType="decimal-pad"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          style={[
                            styles.input,
                            styles.amountInput,
                            {
                              backgroundColor: theme.inputBg,
                              borderColor: errors.amount
                                ? theme.error
                                : theme.border,
                              color: isDark ? theme.text : "#000000",
                            },
                          ]}
                          autoCorrect={false}
                          autoCapitalize="none"
                        />
                      </View>
                      {errors.amount && (
                        <View style={styles.errorContainer}>
                          <MaterialIcons
                            name="error-outline"
                            size={16}
                            color={theme.error}
                          />
                          <Text
                            style={[styles.errorText, { color: theme.error }]}
                          >
                            {errors.amount.message}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                />

                <TouchableOpacity
                  style={[styles.submitButton, { shadowColor: theme.primary }]}
                  onPress={handleSubmit(onSubmit)}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[theme.gradientStart, theme.gradientEnd]}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isProcessing ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={theme.text} />
                        <Text style={[styles.buttonText, { color: theme.text }]}>
                          Processing...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <FontAwesome name="send" size={20} color={theme.text} />
                        <Text style={[styles.buttonText, { color: theme.text }]}>
                          TRANSFER MONEY
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
                  Select Bank & IFSC
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
                keyExtractor={(item:any,index:any) => index?.toString() || Math.random().toString()}
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
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    height: 56,
    width: 56,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1.5,
    borderRightWidth: 0,
  },
  currencyText: {
    fontSize: 24,
    fontWeight: "700",
  },
  amountInput: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    flex: 1,
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
});