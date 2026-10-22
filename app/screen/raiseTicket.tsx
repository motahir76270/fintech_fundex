
import HeaderSection from "@/components/navbar/header";
import { useCompany } from "@/constants/string";
import {
    CreateticketApiCall,
    getSupportType,
} from "@/hooks/servies/serviceApi";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from "react-native";

import { z } from "zod";

// Storage keys
const STORAGE_KEYS = {
  TICKETS_DATA: "@support_tickets_data",
  LAST_FETCH_TIME: "@support_tickets_last_fetch",
  INITIAL_FETCH_DONE: "@support_tickets_initial_fetch",
};

// Form validation schema
const ticketSchema = z.object({
  type: z.string().min(1, "Ticket type is required"),
  txnid: z.string().min(1, "Transaction ID is required"),
  remark: z.string().min(10, "Remark must be at least 10 characters"),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface Ticket {
  id: number;
  ticketid: string;
  service: string;
  message: string;
  status: string;
  txnid: string;
  date: string;
  adminmsg: string | null;
  uid: string;
}

export default function RaisedTicket() {
  const colorScheme = useColorScheme();
  const company = useCompany();
  const isDark = colorScheme === "dark";
  const [supportData, setSupportData] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // New state for initial loading

  // Polling timer reference
  const pollingTimerRef = useRef<NodeJS.Timeout | any>(null);

  // Polling interval (30 seconds)
  const POLLING_INTERVAL = 30000;

  const colors = {
    background: isDark ? "#021a22" : "#eaf3f6",
    header: isDark ? "#032834" : "#2a0888",
    card: isDark ? "#0f2b33" : "#ffffff",
    text: isDark ? "#ffffff" : "#000000",
    border: isDark ? "#2f4f58" : "#ccc",
    button: isDark ? "#0b4a5a" : "#350083",
    placeholder: "#9ca3af",
    operatorItem: isDark ? "#1a3a45" : "#f0f0f0",
    planCard: isDark ? "#1a3a45" : "#f8f9fa",
    planBorder: isDark ? "#2f4f58" : "#e0e0e0",
    overlay: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
    statusPending: "#f59e0b",
    statusResolved: "#10b981",
    statusClosed: "#ef4444",
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      type: "",
      txnid: "",
      remark: "",
    },
  });

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
    return () => {
      // Cleanup polling on unmount
      stopPolling();
    };
  }, []);

  // Start polling after initial fetch
  const startPolling = () => {
    stopPolling(); // Clear any existing timer
    pollingTimerRef.current = setInterval(() => {
      fetchTicketTypes(true); // Silent fetch for polling
    }, POLLING_INTERVAL);
  };

  const stopPolling = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };

  // Load cached data from AsyncStorage
  const loadCachedData = async () => {
    try {
      const cachedTickets = await AsyncStorage.getItem(
        STORAGE_KEYS.TICKETS_DATA,
      );
      const initialFetchDone = await AsyncStorage.getItem(
        STORAGE_KEYS.INITIAL_FETCH_DONE,
      );

      if (cachedTickets) {
        const parsedTickets = JSON.parse(cachedTickets);
        setSupportData(parsedTickets);
      }

      // Only fetch from API if initial fetch hasn't been donelog

      if (!initialFetchDone) {
        await fetchTicketTypes(false);
      } else {
        // Start polling for updates
        startPolling();
        setInitialLoading(false);
      }
    } catch (error) {
      console.error("Error loading cached data:", error);
      // If error loading cache, fetch fresh data
      await fetchTicketTypes(false);
    } finally {
      setInitialLoading(false);
    }
  };

  // Save tickets to AsyncStorage
  const saveTicketsToCache = async (tickets: Ticket[]) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.TICKETS_DATA,
        JSON.stringify(tickets),
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_FETCH_TIME,
        new Date().toISOString(),
      );
    } catch (error) {
      console.error("Error saving tickets to cache:", error);
    }
  };

  // Mark initial fetch as done
  const markInitialFetchDone = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INITIAL_FETCH_DONE, "true");
    } catch (error) {
      console.error("Error marking initial fetch:", error);
    }
  };

  // Fetch ticket types
  const fetchTicketTypes = async (isPolling: boolean = false) => {
    // Only show loading indicator for non-polling fetches
    if (!isPolling) {
      setLoading(true);
    }

    try {
      const res = await getSupportType();

      if (res?.status === "SUCCESS") {
        const tickets = res?.data?.supportTickets || [];
        setSupportData(tickets);

        // Save to cache
        await saveTicketsToCache(tickets);

        // Mark initial fetch as done if this is the first successful fetch
        const initialFetchDone = await AsyncStorage.getItem(
          STORAGE_KEYS.INITIAL_FETCH_DONE,
        );
        if (!initialFetchDone) {
          await markInitialFetchDone();
          // Start polling after first successful fetch
          startPolling();
        }

        if (!isPolling) {
          // console.log('Fetched fresh tickets:', tickets.length);
        }
      } else {
        if (!isPolling) {
          Alert.alert(`${res?.status}`, `${res?.message}`);
        } else {
          console.log("Polling fetch failed:", res?.message);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      if (!isPolling) {
        Alert.alert("Error", "Failed to fetch tickets");
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
      setInitialLoading(false);
    }
  };

  // Manual refresh (with pull-to-refresh)
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTicketTypes(false);
    setRefreshing(false);
  };

  const onSubmit = async (data: TicketFormData) => {
    setSubmitting(true);
    const payload = {
      service: data?.type,
      message: data?.remark,
      txnid: data?.txnid,
    };

    try {
      const res = await CreateticketApiCall(payload);

      if (res?.status === "SUCCESS") {
        Alert.alert(`${res?.status}`, `${res?.message}`);
        reset();
        // Refresh tickets after successful submission
        await fetchTicketTypes(false);
      } else {
        Alert.alert(`${res?.status}`, `${res?.message}`);
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
      Alert.alert("Error", "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return colors.statusPending;
      case "RESOLVED":
        return colors.statusResolved;
      case "CLOSED":
        return colors.statusClosed;
      default:
        return colors.placeholder;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "time-outline";
      case "RESOLVED":
        return "checkmark-circle-outline";
      case "CLOSED":
        return "close-circle-outline";
      default:
        return "help-circle-outline";
    }
  };

  const renderTicketItem = ({ item }: { item: Ticket }) => (
    <View style={[styles.ticketCard, { backgroundColor: colors.card }]}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketIdContainer}>
          <Ionicons name="pricetag-outline" size={16} color={colors.text} />
          <Text style={[styles.ticketId, { color: colors.text }]}>
            {item.ticketid}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Ionicons
            name={getStatusIcon(item.status)}
            size={14}
            color={getStatusColor(item.status)}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.ticketBody}>
        <View style={styles.ticketInfo}>
          <Ionicons
            name="business-outline"
            size={16}
            color={colors.placeholder}
          />
          <Text style={[styles.ticketService, { color: colors.text }]}>
            {item.service}
          </Text>
        </View>

        <View style={styles.ticketInfo}>
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={colors.placeholder}
          />
          <Text
            style={[styles.ticketMessage, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
        </View>

        <View style={styles.ticketInfo}>
          <Ionicons
            name="receipt-outline"
            size={16}
            color={colors.placeholder}
          />
          <Text style={[styles.ticketTxnId, { color: colors.placeholder }]}>
            TXN ID: {item.txnid || "NA"}
          </Text>
        </View>

        <View style={styles.ticketFooter}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.placeholder}
          />
          <Text style={[styles.ticketDate, { color: colors.placeholder }]}>
            {new Date(item.date).toLocaleString()}
          </Text>
        </View>
      </View>

      {item.adminmsg && (
        <View
          style={[
            styles.adminMessage,
            { backgroundColor: colors.operatorItem },
          ]}
        >
          <Ionicons
            name="person-circle-outline"
            size={16}
            color={colors.text}
          />
          <Text style={[styles.adminMessageText, { color: colors.text }]}>
            Admin: {item.adminmsg}
          </Text>
        </View>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.header,
      paddingTop: 20,
      paddingVertical: 15,
      paddingBottom: -20,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 20,
    },
    headerTitle: {
      color: "#ffffff",
      fontSize: 20,
      fontWeight: "bold",
    },
    headerIcon: {
      color: "#ffffff",
    },
    formContainer: {
      padding: 20,
      paddingBottom: 120,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "500",
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: errors.type ? "#ef4444" : colors.border,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    inputIcon: {
      padding: 12,
      color: colors.placeholder,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      paddingVertical: 12,
      paddingRight: 12,
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    errorText: {
      color: "#ef4444",
      fontSize: 12,
      marginTop: 4,
      marginLeft: 4,
    },
    submitButton: {
      backgroundColor: colors.button,
      borderRadius: 8,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    submitButtonText: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "600",
      marginRight: 8,
    },
    bankInfo: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
      padding: 5,
      backgroundColor: colors.operatorItem,
      borderRadius: 8,
    },
    bankIcon: {
      marginRight: 10,
    },
    bankName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "500",
    },
    bankService: {
      color: colors.placeholder,
      fontSize: 14,
    },
    // Ticket List Styles
    ticketListHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
      paddingHorizontal: 5,
    },
    ticketListTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    ticketCount: {
      fontSize: 14,
      color: colors.placeholder,
      backgroundColor: colors.card,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    ticketCard: {
      borderRadius: 12,
      padding: 15,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    ticketHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    ticketIdContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    ticketId: {
      fontSize: 12,
      fontWeight: "600",
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "600",
    },
    ticketBody: {
      gap: 8,
    },
    ticketInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    ticketService: {
      fontSize: 14,
      fontWeight: "500",
      flex: 1,
    },
    ticketMessage: {
      fontSize: 13,
      flex: 1,
    },
    ticketTxnId: {
      fontSize: 12,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    },
    ticketFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    ticketDate: {
      fontSize: 11,
    },
    adminMessage: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      paddingTop: 10,
      paddingHorizontal: 10,
      paddingBottom: 8,
      borderRadius: 8,
    },
    adminMessageText: {
      fontSize: 12,
      flex: 1,
      fontStyle: "italic",
    },
    loadingContainer: {
      padding: 20,
      alignItems: "center",
    },
    emptyContainer: {
      padding: 40,
      alignItems: "center",
    },
    emptyText: {
      color: colors.placeholder,
      fontSize: 14,
      marginTop: 8,
    },
    // Full screen loading overlay
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    loadingOverlayContent: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    loadingText: {
      color: colors.text,
      fontSize: 16,
      marginTop: 12,
      fontWeight: "500",
    },
  });

  return (
    <>
      <KeyboardAvoidingView style={styles.container}>
        {/* Header */}
           <HeaderSection title="Raised Ticket" />
       

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.button]}
              tintColor={colors.button}
            />
          }
        >
          <View style={styles.formContainer}>
            {/* Bank Info Card */}
            <View style={styles.bankInfo}>
              <Image
                source={company.logo}
                style={{ width: 112, height: 82, borderRadius: 18 }}
              />
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              {/* Type Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    name="type"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Select ticket type"
                        placeholderTextColor={colors.placeholder}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </View>
                {errors.type && (
                  <Text style={styles.errorText}>{errors.type.message}</Text>
                )}
              </View>

              {/* Transaction ID Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Transaction ID</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="receipt-outline"
                    size={20}
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    name="txnid"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Enter transaction ID"
                        placeholderTextColor={colors.placeholder}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </View>
                {errors.txnid && (
                  <Text style={styles.errorText}>{errors.txnid.message}</Text>
                )}
              </View>

              {/* Remark Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Remark</Text>
                <View style={[styles.inputWrapper]}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={20}
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    name="remark"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Enter your remarks (min 10 characters)"
                        placeholderTextColor={colors.placeholder}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        multiline
                        numberOfLines={4}
                      />
                    )}
                  />
                </View>
                {errors.remark && (
                  <Text style={styles.errorText}>{errors.remark.message}</Text>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? "SUBMITTING..." : "SUBMIT"}
                </Text>
                {!submitting && (
                  <Ionicons name="send-outline" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Ticket List Section */}
            <View style={styles.ticketListHeader}>
              <Text style={styles.ticketListTitle}>My Tickets</Text>
              <Text style={styles.ticketCount}>{supportData.length} Tickets</Text>
            </View>

            {!initialLoading && loading && supportData.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.button} />
                <Text style={[styles.emptyText, { marginTop: 10 }]}>
                  Loading tickets...
                </Text>
              </View>
            ) : !initialLoading && supportData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="ticket-outline"
                  size={48}
                  color={colors.placeholder}
                />
                <Text style={styles.emptyText}>No tickets raised yet</Text>
                <Text style={[styles.emptyText, { fontSize: 12 }]}>
                  Submit a ticket to get support
                </Text>
              </View>
            ) : (
              !initialLoading && (
                <FlatList
                  data={supportData}
                  renderItem={renderTicketItem}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              )
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Full Screen Loading Overlay */}
      {(initialLoading || (loading && supportData.length === 0)) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingOverlayContent}>
            <ActivityIndicator size="large" color={colors.button} />
            <Text style={styles.loadingText}>
              {initialLoading ? "Loading tickets..." : "Fetching tickets..."}
            </Text>
          </View>
        </View>
      )}

      {/* Submitting Overlay */}
      {submitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingOverlayContent}>
            <ActivityIndicator size="large" color={colors.button} />
            <Text style={styles.loadingText}>Submitting ticket...</Text>
          </View>
        </View>
      )}
    </>
  );
}