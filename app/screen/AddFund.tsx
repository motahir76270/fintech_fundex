import { GetBanklistApiCall, TopUpApicall } from "@/hooks/servies/addfundApi";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useDispatch } from "react-redux";
import { z } from "zod";
import DateTimePicker from "@react-native-community/datetimepicker";

/* ---------------- schema ---------------- */

const addFundSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be greater than 0",
    }),

  rrn: z.string().min(1, "RRN is required"),

  txn_date: z.string().refine((date) => {
    const today = new Date().toISOString().split("T")[0];
    return date <= today;
  }, "Transaction date cannot be in the future"),

  proof: z.any().refine((val) => val !== null && val !== undefined, "Proof image is required"),
});

type AddFundFormData = z.infer<typeof addFundSchema>;

/* ---------------- types ---------------- */
interface Bank {
  id: number;
  account: string;
  bank: string;
  bname: string;
  ifsc: string;
  name: string;
}

/* ---------------- component ---------------- */

const AddFund = () => {
  const colorScheme = useColorScheme();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const isDark = colorScheme === "dark";
  const [banklist, setBanklist] = useState<Bank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [selectedBankName, setSelectedBankName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [isRefreshingBanks, setIsRefreshingBanks] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const colors = {
    light: {
      primary: "#350083",
      gradientStart: "#4F1CA9",
      gradientEnd: "#350083",
      text: "#FFFFFF",
      icon: "#FFFFFF",
      selectedBg: "#f0e6ff",
    },
    dark: {
      primary: "#032834",
      gradientStart: "#05445E",
      gradientEnd: "#032834",
      text: "#FFFFFF",
      icon: "#FFFFFF",
      selectedBg: "#0a2a33",
    },
  };

  const theme = isDark ? colors.dark : colors.light;

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddFundFormData>({
    resolver: zodResolver(addFundSchema),
    defaultValues: {
      amount: "",
      rrn: "",
      txn_date: new Date().toISOString().split("T")[0],
      proof: null,
    },
  });

  /* ---------- permission ---------- */

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera roll permission required");
      }
    })();
  }, []);

  // Fetch banks on component mount
  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async (isRefresh = false) => {
    // Show full loader only on initial load
    if (isRefresh) {
      setIsRefreshingBanks(true);
    } else {
      setIsLoadingBanks(true);
    }

    try {
      const res = await GetBanklistApiCall(dispatch);

      if (res?.data?.addfundBanks && Array.isArray(res.data.addfundBanks)) {
        const mappedBanks = res.data.addfundBanks.map((bank: any) => ({
          id: bank.id,
          account: bank.account,
          bank: bank.bank,
          bname: bank.bname,
          ifsc: bank.ifsc,
          name: bank.name,
        }));

        setBanklist(mappedBanks);
      } else {
        Alert.alert("Error", "Bank list cannot be fetched");
      }
    } catch {
      Alert.alert("Error", "Failed to fetch bank list");
    } finally {
      setIsLoadingBanks(false);
      setIsRefreshingBanks(false);
    }
  };

  // Filter banks based on search query
  const filteredBankList =
    searchQuery.trim() === ""
      ? banklist
      : banklist.filter(
          (bank) =>
            bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bank.bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bank.bname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bank.ifsc.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bank.account.includes(searchQuery)
        );

  const selectBank = (bank: Bank) => {
    setSelectedBankId(bank.id.toString());
    setSelectedBankName(`${bank.bank} - ${bank.name} (${bank.account.slice(-4)})`);
  };

  /* ---------- date picker handler ---------- */

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setValue("txn_date", formattedDate, { shouldValidate: true });
    }
  };

  /* ---------- image picker ---------- */

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.2,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const fileName = asset.uri.split("/").pop() || "proof.jpg";

        const file = {
          uri: asset.uri,
          name: fileName,
          type: "image/jpeg",
        };

        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const sizeKB = blob.size / 1024;

        if (sizeKB > 200) {
          Alert.alert("Image too large", "Please select an image smaller than 200KB");
          return;
        }

        setImagePreview(asset.uri);
        setValue("proof", file, { shouldValidate: true });
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Image selection failed");
    }
  };

  /* ---------- submit ---------- */

  const onFormSubmit = async (data: AddFundFormData) => {
    if (!selectedBankId) {
      Alert.alert("Error", "Please select a bank");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("amount", data.amount);
      formData.append("bank", selectedBankId);
      formData.append("rrn", data.rrn);
      formData.append("txn_date", data.txn_date);

      if (data.proof) {
        formData.append("proof", {
          uri: data.proof.uri,
          name: data.proof.name,
          type: data.proof.type,
        } as any);
      }

      const res = await TopUpApicall(formData);

      if (res?.status === "SUCCESS") {
        reset();
        setImagePreview(null);
        setSelectedBankId("");
        setSelectedBankName("");
        Alert.alert(`${res?.status}`, `${res?.message}`);
        await router.back();
      } else {
        Alert.alert(`${res?.status || "Error"}`, `${res?.message || "Something went wrong"}`);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to add funds");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- refresh bank list ---------- */

  const handleRefreshBanks = async () => {
    await fetchBanks(true);
  };

  // Render bank item
  const renderBankItem = ({ item }: { item: Bank }) => {
    const isSelected = selectedBankId === item.id.toString();

    return (
      <View
        style={[
          styles.bankItem,
          isSelected && {
            backgroundColor: theme.selectedBg,
            borderLeftColor: theme.primary,
            borderLeftWidth: 4,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.bankContent}
          onPress={() => selectBank(item)}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <View style={styles.bankInfo}>
            <View style={styles.bankHeader}>
              <Text style={styles.bankName}>{item.bank}</Text>
              {isSelected && (
                <FontAwesome5 name="check-circle" size={18} color={theme.primary} />
              )}
            </View>
            <Text style={styles.accountHolder}>Account Holder: {item.name}</Text>
            <Text style={styles.bankDetails}>
              {item.bname} • {item.account}
            </Text>
            <Text style={styles.ifscCode}>IFSC: {item.ifsc}</Text>
          </View>
        </TouchableOpacity>

      </View>
    );
  };

  // Render empty state for bank list
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="university" size={50} color="#ccc" />
      <Text style={styles.emptyText}>
        {searchQuery ? "No banks match your search" : "No banks available"}
      </Text>
      {searchQuery ? (
        <TouchableOpacity
          style={styles.clearSearchBtn}
          onPress={() => setSearchQuery("")}
        >
          <Text style={styles.clearSearchText}>Clear Search</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.clearSearchBtn, { backgroundColor: theme.primary }]}
          onPress={handleRefreshBanks}
          disabled={isRefreshingBanks}
        >
          {isRefreshingBanks ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.clearSearchText, { color: "#fff" }]}>
              Refresh Banks
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  /* ---------- UI ---------- */

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Section */}
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <FontAwesome5 name="angle-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Add Funds</Text>
          <View style={styles.headerRight} />
        </LinearGradient>

        {/* Add Fund Form Container */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Form Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Add Fund Details</Text>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount *</Text>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.amount && styles.inputError]}
                      placeholder="Enter amount"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                      editable={!isSubmitting}
                    />
                  )}
                />
                {errors.amount && (
                  <Text style={styles.errorText}>{errors.amount.message}</Text>
                )}
              </View>

              {/* RRN */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>RRN *</Text>
                <Controller
                  control={control}
                  name="rrn"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.rrn && styles.inputError]}
                      placeholder="Enter RRN"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                      editable={!isSubmitting}
                    />
                  )}
                />
                {errors.rrn && (
                  <Text style={styles.errorText}>{errors.rrn.message}</Text>
                )}
              </View>

              {/* Transaction Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Transaction Date *</Text>
                <Controller
                  control={control}
                  name="txn_date"
                  render={({ field: { value } }) => (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.input,
                          styles.datePickerButton,
                          errors.txn_date && styles.inputError,
                        ]}
                        onPress={() => setShowDatePicker(true)}
                        disabled={isSubmitting}
                      >
                        <Text style={value ? styles.dateText : styles.placeholderText}>
                          {value || "Select transaction date"}
                        </Text>
                        <FontAwesome5 name="calendar-alt" size={18} color="#666" />
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={value ? new Date(value) : new Date()}
                          mode="date"
                          display={Platform.OS === "ios" ? "spinner" : "default"}
                          onChange={onDateChange}
                          maximumDate={new Date()}
                        />
                      )}
                    </>
                  )}
                />
                {errors.txn_date && (
                  <Text style={styles.errorText}>{errors.txn_date.message}</Text>
                )}
              </View>

              {/* Proof */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Proof *</Text>
                <TouchableOpacity
                  style={[
                    styles.uploadBtn,
                    { borderColor: theme.primary },
                    errors.proof && styles.inputError,
                  ]}
                  onPress={handleImagePick}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.uploadText, { color: theme.primary }]}>
                    {imagePreview ? "Change Proof Image" : "Upload Proof Image"}
                  </Text>
                </TouchableOpacity>
                {imagePreview && (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: imagePreview }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => {
                        setImagePreview(null);
                        setValue("proof", null, { shouldValidate: true });
                      }}
                      disabled={isSubmitting}
                    >
                      <FontAwesome5 name="times-circle" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Selected Bank Info */}
              {selectedBankId && (
                <View style={styles.selectedBankInfo}>
                  <Text style={styles.selectedBankLabel}>Selected Bank:</Text>
                  <Text style={styles.selectedBankText}>{selectedBankName}</Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                onPress={handleSubmit(onFormSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>Add Funds</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Separator Line */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Available Banks</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Bank List Section */}
            <View style={styles.bankSection}>
              <View style={styles.bankSectionHeader}>
                <FontAwesome5 name="university" size={20} color={theme.primary} />
                <Text style={styles.bankSectionTitle}>Select Bank Account</Text>

                {/* ✅ Global Refresh Button in Section Header */}
                <TouchableOpacity
                  style={styles.refreshHeaderBtn}
                  onPress={handleRefreshBanks}
                  disabled={isRefreshingBanks || isSubmitting}
                >
                  {isRefreshingBanks ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <FontAwesome5 name="sync-alt" size={16} color={theme.primary} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <FontAwesome5 name="search" size={16} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search banks by name, account, or IFSC..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    style={styles.clearButton}
                  >
                    <FontAwesome5 name="times-circle" size={16} color="#999" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Banks List */}
              {isLoadingBanks ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={styles.loadingText}>Loading banks...</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredBankList}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderBankItem}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={renderEmptyList}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled={false}
                />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default AddFund;

/* ---------------- styles ---------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 10 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  headerLeft: {
    padding: 8,
  },

  headerRight: {
    width: 40,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },

  formContainer: {
    flex: 1,
  },

  formSection: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
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

  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dateText: {
    fontSize: 14,
    color: "#333",
  },

  placeholderText: {
    fontSize: 14,
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

  uploadBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },

  uploadText: {
    fontWeight: "500",
  },

  previewContainer: {
    position: "relative",
    marginTop: 10,
    alignSelf: "flex-start",
  },

  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },

  removeImageBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },

  submitBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },

  selectedBankInfo: {
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },

  selectedBankLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 4,
  },

  selectedBankText: {
    fontSize: 14,
    color: "#1b5e20",
    fontWeight: "500",
  },

  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 20,
  },

  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },

  separatorText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },

  bankSection: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 230,
  },

  bankSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  bankSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
    flex: 1, // ✅ pushes refresh button to right
  },

  // ✅ Header refresh button
  refreshHeaderBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 10,
  },

  clearButton: {
    padding: 4,
  },

  // ✅ Updated bankItem to be a row/container
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },

  bankContent: {
    flex: 1,
  },

  bankHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  bankInfo: {
    flex: 1,
  },

  bankName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },

  accountHolder: {
    fontSize: 14,
    color: "#555",
    marginBottom: 2,
  },

  bankDetails: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },

  ifscCode: {
    fontSize: 11,
    color: "#888",
  },

  // ✅ Per-item refresh button
  refreshItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginLeft: 8,
    backgroundColor: "#fff",
    gap: 6,
  },

  refreshItemText: {
    fontSize: 11,
    fontWeight: "600",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
    marginBottom: 15,
    textAlign: "center",
  },

  clearSearchBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
  },

  clearSearchText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  loadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
});