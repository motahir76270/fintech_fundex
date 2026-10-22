import AddBeneficiaryModal from "@/components/modal/payout/addBeneModal";
import TransactionPinModal from "@/components/modal/payout/transactionPinModal";
import {
  addBeneAccountApical,
  deleteBeneAccountApicall,
  getBeneAccountDetailsApi,
  initiateTransactionApiCall,
} from "@/hooks/servies/payoutApi";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

// Color lights from your previous code
const colors = {
  light: {
    primary: "#350083",
    gradientStart: "#4F1CA9",
    gradientEnd: "#350083",
    text: "#FFFFFF",
    icon: "#FFFFFF",
    card: "#FFFFFF",
    inputBg: "#F8F9FA",
    label: "#6B7280",
    error: "#EF4444",
    success: "#10B981",
    border: "#E5E7EB",
    shadow: "rgba(79, 28, 169, 0.1)",
    secondary: "#6D28D9",
    accent: "#F59E0B",
    background: "#F3F4F6",
  },
  dark: {
    primary: "#032834",
    gradientStart: "#05445E",
    gradientEnd: "#032834",
    text: "#FFFFFF",
    icon: "#FFFFFF",
    card: "#1A1A1A",
    inputBg: "#2D2D2D",
    label: "#9CA3AF",
    error: "#F87171",
    success: "#34D399",
    border: "#374151",
    shadow: "rgba(3, 40, 52, 0.3)",
    secondary: "#7C3AED",
    accent: "#FBBF24",
    background: "#111827",
  },
};

const payoutSchema = z.object({
  mobileNumber: z
    .string()
    .min(10, "Mobile number must be 10 digits")
    .max(10, "Mobile number must be 10 digits")
    .regex(/^\d+$/, "Must contain only numbers"),
  account: z.string().min(1, "Account number is required"),
  amount: z
    .string()
    .min(1, "Amount 100 minimum is required")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Enter valid amount",
    )
    .refine((val) => Number(val) >= 100, "Minimum amount is ₹100"),
  paymentType: z.enum(["IMPS", "NEFT"]),
});

type PayoutFormData = z.infer<typeof payoutSchema>;

interface BeneficiaryAccount {
  id: number;
  uid: string;
  name: string;
  account: string;
  ifsc: string;
  bank_name: string;
  passbook: string;
  status: string;
  date: string;
}

export default function PayoutScreen() {
  const [paymentType, setPaymentType] = useState<"IMPS" | "NEFT">("IMPS");
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [allAcountData, setAllAcountData] = useState<BeneficiaryAccount[]>([]);
  const [selectAccount, setSelectAccount] = useState<any>("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pendingTransactionData, setPendingTransactionData] =
    useState<any>(null);
  const accountInputRef = useRef<TextInput>(null);
  const colorScheme = useColorScheme();
  const router = useRouter();
  
  const theme = colorScheme === "dark" ? colors.dark : colors.light;
  const isDark = colorScheme === "dark";

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    reset,
  } = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      mobileNumber: "",
      account: "",
      amount: "",
      paymentType: "IMPS",
    },
    mode: "onChange",
  });

  // Load accounts on component mount
  useEffect(() => {
    handleAccountbtn();
  }, []);

  // Filter accounts based on search query
  const filteredAccounts = allAcountData.filter(
    (account) =>
      account.account.includes(searchQuery) ||
      account.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddBeneficiary = async (beneficiary: any) => {
 
    const res = await addBeneAccountApical(beneficiary);

    if (res.status === "SUCCESS") {
      setModalVisible(false);
      Alert.alert(`${res?.status}`, `${res?.message}`);
      await handleAccountbtn();
    } else {
      Alert.alert(`${res?.status}`, `${res?.message}`);
    }
  };

  const handleAccountbtn = async () => {
    setIsLoadingAccounts(true);
    const res = await getBeneAccountDetailsApi();
    if (res.status === "SUCCESS") {
      setAllAcountData(res?.data?.payoutAccounts);
    } else {
      Alert.alert(`${res.status}`, `${res.message}`);
    }
    setIsLoadingAccounts(false);
  };

  const handleDeleteAccount = async (accountId: any, accountName: string) => {
    Alert.alert(
      "Delete Beneficiary",
      `Are you sure you want to delete ${accountName}'s account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteBeneAccountApicall(accountId);
              if (res.status === "SUCCESS") {
                Alert.alert("Success", "Beneficiary deleted successfully");
                await handleAccountbtn();
                if (selectAccount === accountId.toString()) {
                  setSelectAccount("");
                  setValue("account", "");
                }
              } else {
                Alert.alert(
                  "Error",
                  res.message || "Failed to delete beneficiary",
                );
              }
            } catch {
              Alert.alert("Error", "Something went wrong");
            }
          },
        },
      ],
    );
  };

  const handleAccountPress = () => {
    Keyboard.dismiss();
    if (allAcountData.length === 0) {
      handleAccountbtn().then(() => {
        setDropdownVisible(true);
      });
    } else {
      setDropdownVisible(true);
    }
  };

  const handleSelectAccount = (account: BeneficiaryAccount) => {
    setValue("account", account.account);
    setSearchQuery(account.account);
    setDropdownVisible(false);
    setSelectAccount(account.id.toString());
  };

  const onSubmit = async (data: PayoutFormData) => {
    if (!selectAccount) {
      Alert.alert("Error", "Please select a beneficiary account");
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        mode: data.paymentType,
        mobile: data.mobileNumber,
        bid: selectAccount,
        amount: data.amount,
      };
      // console.log(payload);
      
      const res = await initiateTransactionApiCall(payload);

      if (res?.status === "SUCCESS") {
        setPendingTransactionData(res?.txn_key);
        setPinModalVisible(true);
        reset();
        // Don't reset form here, wait for successful transaction
      } else {
        Alert.alert(`${res?.status}`, `${res?.message}`);
        setIsProcessing(false);
      }
    } catch (error) {
      Alert.alert("Failed", `${error}`);
      setIsProcessing(false);
    }
  };

  const renderInput = (
    name: keyof PayoutFormData,
    placeholder: string,
    icon: keyof typeof MaterialIcons.glyphMap,
    options: any = {},
  ) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelRow}>
        <MaterialIcons
          name={icon}
          size={20}
          color={theme.primary}
          style={styles.inputIcon}
        />
        <Text style={[styles.inputLabel, { color: theme.label }]}>
          {placeholder}
        </Text>
      </View>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <>
            <TouchableOpacity
              activeOpacity={name === "account" ? 0.7 : 1}
              onPress={name === "account" ? handleAccountPress : undefined}
            >
              <View pointerEvents={name === "account" ? "none" : "auto"}>
                <TextInput
                  ref={name === "account" ? accountInputRef : undefined}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: errors[name] ? theme.error : theme.border,
                      color: isDark ? theme.text : "#000000",
                    },
                    options.multiline && styles.multilineInput,
                    name === "account" && styles.accountInput,
                  ]}
                  placeholder={`Enter ${placeholder.toLowerCase()}`}
                  placeholderTextColor={theme.label}
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    onChange(text);
                    if (name === "account") {
                      setSearchQuery(text);
                    }
                  }}
                  value={value}
                  selectionColor={theme.primary}
                  editable={name !== "account"}
                  {...options}
                />
                {name === "account" && allAcountData.length > 0 && (
                  <View style={styles.dropdownIcon}>
                    <MaterialIcons
                      name="arrow-drop-down"
                      size={24}
                      color={theme.primary}
                    />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            {errors[name] && (
              <View style={styles.errorContainer}>
                <MaterialIcons
                  name="error-outline"
                  size={16}
                  color={theme.error}
                />
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {errors[name]?.message}
                </Text>
              </View>
            )}
          </>
        )}
      />
    </View>
  );

  const renderDropdownItem = ({ item }: { item: BeneficiaryAccount }) => (
    <TouchableOpacity
      style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
      onPress={() => handleSelectAccount(item)}
    >
      <View style={styles.dropdownItemContent}>
        <View style={styles.dropdownItemLeft}>
          <MaterialIcons
            name="account-balance"
            size={20}
            color={theme.primary}
          />
          <View style={styles.dropdownItemText}>
            <Text
              style={[styles.dropdownAccountName, { color: theme.primary }]}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.dropdownAccountNumber, { color: theme.label }]}
            >
              Account: {item.account}
            </Text>
            {item.ifsc && (
              <Text style={[styles.dropdownIfsc, { color: theme.label }]}>
                IFSC: {item.ifsc}
              </Text>
            )}
          </View>
        </View>
        <MaterialIcons name="check-circle" size={20} color={theme.success} />
      </View>
    </TouchableOpacity>
  );

  const renderBeneficiaryItem = ({ item }: { item: BeneficiaryAccount }) => (
    <View
      style={[
        styles.beneficiaryCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.beneficiaryContent}
        onPress={() => handleSelectAccount(item)}
      >
        <View style={styles.beneficiaryIcon}>
          <LinearGradient
            colors={[theme.gradientStart, theme.gradientEnd]}
            style={styles.beneficiaryIconGradient}
          >
            <Text style={styles.beneficiaryInitial}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.beneficiaryInfo}>
          <View style={styles.beneficiaryNameRow}>
            <Text style={[styles.beneficiaryName, { color: theme.primary }]}>
              {item.name}
            </Text>
            <Text
              style={[
                styles.beneficiaryStatus,
                {
                  color: item?.status === "APPROVED" ? "#10B981" : theme.error,
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
          <Text style={[styles.beneficiaryDetails, { color: theme.label }]}>
            {item.account}
          </Text>
          <Text style={[styles.beneficiaryBank, { color: theme.label }]}>
            {item.bank_name} • {item.ifsc}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteAccount(item.id, item.name)}
      >
        <MaterialIcons name="delete-outline" size={24} color={theme.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView style={styles.header} edges={["top"]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Payout
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: "rgba(255,255,255,0.9)" },
              ]}
            >
              Fast & Secure Money Transfer
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBeneficiaryButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="person-add-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Form Card */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: theme.card,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <View style={styles.formHeader}>
            <LinearGradient
              colors={[theme.gradientStart, theme.gradientEnd]}
              style={styles.formIconContainer}
            >
              <Ionicons name="cash-outline" size={28} color={theme.text} />
            </LinearGradient>
            <View>
              <Text style={[styles.formTitle, { color: theme.primary }]}>
                Transfer Details
              </Text>
              <Text style={[styles.formSubtitle, { color: theme.label }]}>
                Fill recipient information below
              </Text>
            </View>
          </View>

          <View style={styles.formBody}>
            {/* Mobile Number */}
            {renderInput("mobileNumber", "Mobile Number", "phone-android", {
              keyboardType: "phone-pad",
              maxLength: 10,
            })}

            {/* Account Number */}
            {renderInput("account", "Account Number", "account-balance", {
              keyboardType: "number-pad",
              maxLength: 18,
            })}

            {/* Amount with Currency */}
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <MaterialIcons
                  name="currency-rupee"
                  size={20}
                  color={theme.primary}
                  style={styles.inputIcon}
                />
                <Text style={[styles.inputLabel, { color: theme.label }]}>
                  Amount
                </Text>
              </View>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View style={styles.amountContainer}>
                      <View
                        style={[
                          styles.currencyPrefix,
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
                        placeholder="Enter amount"
                        placeholderTextColor={theme.label}
                        keyboardType="decimal-pad"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        selectionColor={theme.primary}
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
                  </>
                )}
              />
            </View>

            {/* Payment Type Selection */}
            <View style={styles.paymentTypeContainer}>
              <Text style={[styles.sectionLabel, { color: theme.primary }]}>
                Select Transfer Mode
              </Text>
              <View style={styles.paymentTypeCards}>
                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor:
                        paymentType === "IMPS" ? theme.primary : theme.border,
                    },
                    paymentType === "IMPS" && {
                      borderColor: theme.primary,
                      backgroundColor: isDark
                        ? "rgba(79, 28, 169, 0.2)"
                        : "rgba(79, 28, 169, 0.05)",
                    },
                  ]}
                  onPress={() => {
                    setPaymentType("IMPS");
                    setValue("paymentType", "IMPS");
                  }}
                >
                  <View
                    style={[
                      styles.paymentIconContainer,
                      {
                        backgroundColor:
                          paymentType === "IMPS"
                            ? theme.primary
                            : theme.inputBg,
                        borderColor:
                          paymentType === "IMPS" ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="flash-on"
                      size={24}
                      color={
                        paymentType === "IMPS" ? theme.text : theme.primary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.paymentTitle,
                      {
                        color:
                          paymentType === "IMPS"
                            ? theme.primary
                            : theme.primary,
                      },
                    ]}
                  >
                    IMPS
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor:
                        paymentType === "NEFT" ? theme.primary : theme.border,
                    },
                    paymentType === "NEFT" && {
                      borderColor: theme.primary,
                      backgroundColor: isDark
                        ? "rgba(79, 28, 169, 0.2)"
                        : "rgba(79, 28, 169, 0.05)",
                    },
                  ]}
                  onPress={() => {
                    setPaymentType("NEFT");
                    setValue("paymentType", "NEFT");
                  }}
                >
                  <View
                    style={[
                      styles.paymentIconContainer,
                      {
                        backgroundColor:
                          paymentType === "NEFT"
                            ? theme.primary
                            : theme.inputBg,
                        borderColor:
                          paymentType === "NEFT" ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="schedule"
                      size={24}
                      color={
                        paymentType === "NEFT" ? theme.text : theme.primary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.paymentTitle,
                      {
                        color:
                          paymentType === "NEFT"
                            ? theme.primary
                            : theme.primary,
                      },
                    ]}
                  >
                    NEFT
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isProcessing || !isValid || !selectAccount) &&
                  styles.submitButtonDisabled,
                { shadowColor: theme.primary },
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={isProcessing || !isValid || !selectAccount}
            >
              <LinearGradient
                colors={[theme.gradientStart, theme.gradientEnd]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialIcons name="lock" size={22} color={theme.text} />
                <Text style={[styles.submitButtonText, { color: theme.text }]}>
                  {isProcessing ? "PROCESSING..." : "SEND OTP"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Security Info */}
            <View
              style={[styles.securityInfo, { borderTopColor: theme.border }]}
            >
              <MaterialIcons
                name="verified-user"
                size={16}
                color={theme.success}
              />
              <Text style={[styles.securityText, { color: theme.label }]}>
                Your transaction is secured with 256-bit encryption
              </Text>
            </View>
          </View>
        </View>

        {/* Beneficiary List Section */}
        <View
          style={[styles.beneficiarySection, { backgroundColor: theme.card }]}
        >
          <View style={styles.beneficiaryHeader}>
            <View style={styles.beneficiaryHeaderLeft}>
              <MaterialIcons name="people" size={24} color={theme.primary} />
              <Text style={[styles.beneficiaryTitle, { color: theme.primary }]}>
                Saved Beneficiaries
              </Text>
            </View>
            <Text style={[styles.beneficiaryCount, { color: theme.label }]}>
              {allAcountData.length} accounts
            </Text>
          </View>

          {isLoadingAccounts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.label }]}>
                Loading beneficiaries...
              </Text>
            </View>
          ) : allAcountData.length > 0 ? (
            <FlatList
              data={allAcountData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderBeneficiaryItem}
              scrollEnabled={false}
              style={styles.beneficiaryList}
            />
          ) : (
            <View style={styles.emptyBeneficiaryContainer}>
              <MaterialIcons
                name="account-balance-wallet"
                size={64}
                color={theme.label}
              />
              <Text
                style={[styles.emptyBeneficiaryText, { color: theme.label }]}
              >
                No beneficiaries added yet
              </Text>
              <TouchableOpacity
                style={[
                  styles.addFirstButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => setModalVisible(true)}
              >
                <Text
                  style={[styles.addFirstButtonText, { color: theme.text }]}
                >
                  Add Your First Beneficiary
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dropdown Modal for Account Selection */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={[styles.dropdownModal, { backgroundColor: theme.card }]}>
            <View
              style={[
                styles.dropdownHeader,
                { borderBottomColor: theme.border },
              ]}
            >
              <Text style={[styles.dropdownTitle, { color: theme.primary }]}>
                Select Account
              </Text>
              <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.label} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View
              style={[
                styles.searchContainer,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
              ]}
            >
              <MaterialIcons name="search" size={20} color={theme.label} />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: isDark ? theme.text : "#000000" },
                ]}
                placeholder="Search by account number or name"
                placeholderTextColor={theme.label}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <MaterialIcons name="clear" size={20} color={theme.label} />
                </TouchableOpacity>
              )}
            </View>

            {filteredAccounts.length > 0 ? (
              <FlatList
                data={filteredAccounts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderDropdownItem}
                showsVerticalScrollIndicator={false}
                style={styles.dropdownList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="account-balance-wallet"
                  size={48}
                  color={theme.label}
                />
                <Text style={[styles.emptyText, { color: theme.label }]}>
                  No accounts found
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addNewButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => {
                    setDropdownVisible(false);
                    setModalVisible(true);
                  }}
                >
                  <Text
                    style={[styles.addNewButtonText, { color: theme.text }]}
                  >
                    Add New Beneficiary
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <TransactionPinModal
        visible={pinModalVisible}
        onClose={() => {
          setPinModalVisible(false);
          setPendingTransactionData(null);
          setIsProcessing(false);
        }}
        recipientName={pendingTransactionData}
      />

      <AddBeneficiaryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddBeneficiary={handleAddBeneficiary}
        theme={theme}
        isDark={isDark}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerGradient: {
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 20,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  addBeneficiaryButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 30,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,
    paddingTop: 10,
  },
  formCard: {
    borderRadius: 24,
    marginTop: 20,
    padding: 20,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  formIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  formSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  formBody: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: "500",
    borderWidth: 2,
  },
  accountInput: {
    position: "relative",
  },
  dropdownIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyPrefix: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderWidth: 2,
    borderRightWidth: 0,
  },
  currencyText: {
    fontSize: 20,
    fontWeight: "700",
  },
  amountInput: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    flex: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
  },
  paymentTypeContainer: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  paymentTypeCards: {
    flexDirection: "row",
    gap: 12,
  },
  paymentCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    alignItems: "center",
  },
  paymentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  securityText: {
    fontSize: 12,
    fontWeight: "500",
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  // Beneficiary List Styles
  beneficiarySection: {
    borderRadius: 24,
    marginTop: 20,
    padding: 20,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    marginBottom: 20,
  },
  beneficiaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  beneficiaryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  beneficiaryTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  beneficiaryCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  beneficiaryList: {
    marginTop: 4,
  },
  beneficiaryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  beneficiaryContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  beneficiaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  beneficiaryIconGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  beneficiaryInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  beneficiaryInfo: {
    flex: 1,
    gap: 4,
  },
  beneficiaryNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  beneficiaryName: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  beneficiaryStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  beneficiaryDetails: {
    fontSize: 13,
    fontWeight: "500",
  },
  beneficiaryBank: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyBeneficiaryContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  emptyBeneficiaryText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  addFirstButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  addFirstButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Dropdown Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownModal: {
    width: "100%",
    maxHeight: "80%",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  dropdownItemText: {
    flex: 1,
  },
  dropdownAccountName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  dropdownAccountNumber: {
    fontSize: 13,
    marginBottom: 1,
  },
  dropdownIfsc: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  addNewButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  addNewButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // PIN Modal Styles
  pinModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pinModalContainer: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  pinModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  pinModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  pinModalContent: {
    padding: 24,
    alignItems: "center",
  },
  pinIconContainer: {
    marginBottom: 20,
  },
  pinIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  pinModalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  pinInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  pinInput: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
  },
  pinErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  pinErrorText: {
    fontSize: 13,
    fontWeight: "500",
  },
  pinConfirmButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  pinConfirmButtonDisabled: {
    opacity: 0.7,
  },
  pinConfirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  pinConfirmText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pinCancelButton: {
    paddingVertical: 12,
  },
  pinCancelText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
