import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import TransactionPinModal from "@/components/modal/qt/doTansactionForm";
import {
  accountDeleteApiCall,
  FetchAccountDetailsApi,
  initiateTransactionApi,
} from "@/hooks/servies/quickTransferApi";
import { setQTData } from "@/redux/quickTransfer/qtSlice";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import AccountVerificationModal from "@/components/modal/qt/AccountVerificationModal";
import AccountTransferModal from "@/components/modal/qt/AccountTransferModal";

// Color themes
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
    background: "#F3F4F6",
    searchBg: "#FFFFFF",
    searchText: "#1F2937",
    searchPlaceholder: "#9CA3AF",
    deleteBg: "#FEE2E2",
    deleteText: "#DC2626",
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
    background: "#111827",
    searchBg: "#1F2937",
    searchText: "#F3F4F6",
    searchPlaceholder: "#6B7280",
    deleteBg: "#7F1D1D",
    deleteText: "#FCA5A5",
  },
};

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

export default function QuickTransferScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? colors.dark : colors.light;
  const isDark = colorScheme === "dark";

  const [fetchAcountData, setFetchAcountData] = useState<FetchedAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<FetchedAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [initiateTransactionData, setInitiateTransactionData] = useState("");
  const [selectedAccountForTransfer, setSelectedAccountForTransfer] = useState<FetchedAccount | null>(null);

  const { getLocation } = useSelector((state: any) => state.services);
  const dispatch = useDispatch();

  // Filter accounts based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAccounts(fetchAcountData);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = fetchAcountData.filter(
        (account) =>
          account.name?.toLowerCase().includes(query) ||
          account.bname?.toLowerCase().includes(query) ||
          account.account?.toLowerCase().includes(query) ||
          account.ifsc?.toLowerCase().includes(query) ||
          account.mobile?.includes(query)
      );
      setFilteredAccounts(filtered);
    }
  }, [searchQuery, fetchAcountData]);

  const handleTransferFromSavedAccount = (account: FetchedAccount) => {
    setSelectedAccountForTransfer(account);
    setTransferModalVisible(true);
  };

  const handleDeleteAccount = (account: FetchedAccount) => {
    Alert.alert(
      "Delete Account",
      `Are you sure you want to delete ${account.name || "this account"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Add your delete API call here
            accountDeleteApiCall(account?.id);
            // After successful deletion, refresh the list
            fetchBankData();
          },
        },
      ]
    );
  };

  const handleTransfer = async (data: any) => {
    try {
      const payload = {
        ...data,
        mobileNumber: selectedAccountForTransfer?.mobile || "",
      };
      
      const res: any = await initiateTransactionApi(payload);
      if (res?.status === "SUCCESS") {
        setInitiateTransactionData(res?.txn_key);
        setPinModalVisible(true);
        setTransferModalVisible(false);
        setSelectedAccountForTransfer(null);
      } else {
        Alert.alert(`${res?.status}`, `${res?.message}`);
      }
    } catch {
      Alert.alert("Error", "Transaction failed");
    }
  };

  const fetchBankData = useCallback(async () => {
    setIsFetching(true);
    try {
      const mobileData = await AsyncStorage.getItem("mobile");
      if (!mobileData) {
        Alert.alert("Error", "Mobile number not found");
        return;
      }

      const number = JSON.parse(mobileData);
      const res = await FetchAccountDetailsApi(number.phone);

      if (res?.status === "SUCCESS") {
        if (res?.data?.qtAccounts && Array.isArray(res.data.qtAccounts)) {
          dispatch(setQTData(res?.data?.qtAccounts));
          setFetchAcountData(res.data.qtAccounts);
          setFilteredAccounts(res.data.qtAccounts);
        } else {
          setFetchAcountData([]);
          setFilteredAccounts([]);
        }
      } else {
        Alert.alert(res?.status, res?.message);
        setFetchAcountData([]);
        setFilteredAccounts([]);
      }
    } catch (error) {
      console.error("Error fetching bank details:", error);
      Alert.alert("Error", "Failed to fetch account details");
      setFetchAcountData([]);
      setFilteredAccounts([]);
    } finally {
      setIsFetching(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchBankData();
  }, [fetchBankData]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  const renderSavedAccountItem = ({ item }: { item: FetchedAccount }) => (
    <View
      style={[
        styles.savedAccountCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
      ]}
    >
      {/* Account Info Section */}
      <TouchableOpacity
        style={styles.accountInfoContainer}
        onPress={() => handleTransferFromSavedAccount(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          style={styles.savedAccountIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FontAwesome name="bank" size={20} color={theme.text} />
        </LinearGradient>

        <View style={styles.savedAccountInfo}>
          <Text
            style={[
              styles.savedAccountName,
              { color: isDark ? theme.text : "#000000" },
            ]}
            numberOfLines={1}
          >
            {item.name || "N/A"}
          </Text>
          <Text style={[styles.savedAccountBank, { color: theme.primary }]}>
            {item.bname || "N/A"}
          </Text>
          <View style={styles.savedAccountDetails}>
            <Text style={[styles.savedAccountDetail, { color: theme.label }]}>
              A/C: {item.account || "N/A"}
            </Text>
            <Text style={[styles.savedAccountDetail, { color: theme.label }]}>
              IFSC: {item.ifsc || "N/A"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtonsContainer}>
        {/* Transfer Button */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => handleTransferFromSavedAccount(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionButtonText, { color: theme.text }]}>
            Transfer
          </Text>
        </TouchableOpacity>
        
        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.deleteBg }]}
          onPress={() => handleDeleteAccount(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionButtonText, { color: theme.deleteText }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptySearch = () => (
    <View style={styles.emptySearchContainer}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.emptySearchIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="search-outline" size={40} color={theme.text} />
      </LinearGradient>
      <Text style={[styles.emptySearchTitle, { color: theme.primary }]}>
        No matching accounts
      </Text>
      <Text style={[styles.emptySearchSubtitle, { color: theme.label }]}>
        Try searching with different keywords
      </Text>
    </View>
  );

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <SafeAreaView style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={28} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Quick Transfer
            </Text>
          </SafeAreaView>
        </LinearGradient>

        {/* Add New Account Button */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.addButton, { shadowColor: theme.primary }]}
            onPress={() => setVerificationModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.gradientStart, theme.gradientEnd]}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add-circle-outline" size={28} color={theme.text} />
              <View style={styles.addButtonTextContainer}>
                <Text style={[styles.addButtonTitle, { color: theme.text }]}>
                  Add New Account
                </Text>
                <Text style={[styles.addButtonSubtitle, { color: theme.text }]}>
                  Verify and add beneficiary
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Saved Accounts Section */}
        {!isFetching && fetchAcountData.length > 0 && (
          <View style={styles.savedAccountsSection}>
            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.searchBg, borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={20} color={theme.label} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.searchText }]}
                placeholder="Search by name, bank, account, IFSC..."
                placeholderTextColor={theme.searchPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color={theme.label} />
                </TouchableOpacity>
              )}
            </View>

            {/* Account List */}
            {filteredAccounts.length > 0 ? (
              <FlatList
                data={filteredAccounts}
                scrollEnabled={false}
                keyExtractor={(item) => item.id?.toString() || item.account}
                renderItem={renderSavedAccountItem}
                contentContainerStyle={styles.savedAccountsListVertical}
              />
            ) : (
              renderEmptySearch()
            )}
          </View>
        )}

        {/* Loading State for Saved Accounts */}
        {isFetching && (
          <View style={[styles.savedAccountsSection, styles.loadingSection]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingAccountsText, { color: theme.label }]}>
              Loading your saved accounts...
            </Text>
          </View>
        )}

        {/* No Accounts State */}
        {!isFetching && fetchAcountData.length === 0 && (
          <View style={styles.noAccountsContainer}>
            <LinearGradient
              colors={[theme.gradientStart, theme.gradientEnd]}
              style={styles.noAccountsIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome name="bank" size={40} color={theme.text} />
            </LinearGradient>
            <Text style={[styles.noAccountsTitle, { color: theme.primary }]}>
              No Saved Accounts
            </Text>
            <Text style={[styles.noAccountsSubtitle, { color: theme.label }]}>
              Add your first beneficiary to get started
            </Text>
            <TouchableOpacity
              style={[styles.addFirstButton, { borderColor: theme.primary }]}
              onPress={() => setVerificationModalVisible(true)}
            >
              <Text style={[styles.addFirstButtonText, { color: theme.primary }]}>
                Add New Account
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Account Verification Modal */}
      <AccountVerificationModal
        visible={verificationModalVisible}
        onClose={() => {
          setVerificationModalVisible(false);
        }}
        onVerifySuccess={() => {
          setVerificationModalVisible(false);
          fetchBankData();
        }}
        theme={theme}
        isDark={isDark}
        getLocation={getLocation}
      />

      {/* Account Transfer Modal */}
      <AccountTransferModal
        visible={transferModalVisible}
        onClose={() => {
          setTransferModalVisible(false);
          setSelectedAccountForTransfer(null);
        }}
        onTransfer={handleTransfer}
        theme={theme}
        isDark={isDark}
        initialAccount={selectedAccountForTransfer}
        getLocation={getLocation}
      />

      <TransactionPinModal
        visible={pinModalVisible}
        onClose={() => {
          setPinModalVisible(false);
          setInitiateTransactionData("");
        }}
        recipientName={initiateTransactionData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 16,
  },
  addButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  addButtonTextContainer: {
    flex: 1,
  },
  addButtonTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  addButtonSubtitle: {
    fontSize: 13,
    opacity: 0.9,
  },
  savedAccountsSection: {
    marginTop: 32,
    marginHorizontal: 20,
  },
  savedAccountsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  savedAccountsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  savedAccountsTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  savedAccountsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  savedAccountsListVertical: {
    paddingVertical: 4,
    gap: 2,
  },
  savedAccountCard: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accountInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  savedAccountIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  savedAccountInfo: {
    flex: 1,
  },
  savedAccountName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  savedAccountBank: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 1,
  },
  savedAccountDetails: {
    flexDirection: "column",
    gap: 1,
    marginTop: 4,
  },
  savedAccountDetail: {
    fontSize: 11,
  },
  actionButtonsContainer: {
    flexDirection: "column",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loadingSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingAccountsText: {
    marginTop: 12,
    fontSize: 14,
  },
  noAccountsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    marginHorizontal: 20,
  },
  noAccountsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  noAccountsTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  noAccountsSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  addFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptySearchContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptySearchIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySearchSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});