import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  useColorScheme,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getComissionPlan } from "@/hooks/servies/serviceApi";
import HeaderSection from "@/components/navbar/header";

const { width } = Dimensions.get("window");

// Storage keys
const STORAGE_KEYS = {
  COMMISSION_DATA: '@commission_plan_data',
  LAST_FETCH_TIME: '@commission_last_fetch',
  INITIAL_FETCH_DONE: '@commission_initial_fetch',
};

// Polling interval (30 seconds)
const POLLING_INTERVAL = 30000;

/* ---------------- Commission Table Card ---------------- */
const CommissionCard = ({ plan, colors }: any) => {
  const { column, tableData } = plan;

  if (!tableData || tableData.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.noDataText, { color: colors.subText }]}>No data available</Text>
      </View>
    );
  }

  // Determine column structure
  const hasFromTo = column.includes('froma') && column.includes('toa');
  const hasOperator = column.includes('operator') || column.includes('opid');
  const hasAmount = column.includes('amount');
  const hasPercent = column.includes('percent');

  // Get header titles based on column structure
  const getHeaderTitles = () => {
    if (hasFromTo) {
      return { left: 'Range (₹)', right: 'Charge (₹)' };
    } else if (hasOperator) {
      return { left: 'Operator', right: 'Commission' };
    } else if (column.includes('amount') && column.length === 2) {
      return { left: 'Amount (₹)', right: 'Charge' };
    }
    return { left: column[0] || 'Type', right: column[1] || 'Value' };
  };

  const headers = getHeaderTitles();

  // Format display value
  const formatDisplayValue = (item: any, field: string) => {
    const value = item[field];
    if (value === undefined || value === null) return '-';
    
    if (field === 'amount' || field === 'froma' || field === 'toa') {
      return `₹${value}`;
    } else if (field === 'percent') {
      return parseFloat(value) > 0 ? `${value}%` : '₹0';
    }
    return value;
  };

  // Get right column value based on available fields
  const getRightValue = (item: any) => {
    if (hasAmount && hasPercent) {
      const amount = parseFloat(item.amount || '0');
      const percent = parseFloat(item.percent || '0');
      if (amount > 0) return `₹${item.amount}`;
      if (percent > 0) return `${item.percent}%`;
      return '₹0';
    } else if (hasAmount) {
      return item.amount ? `₹${item.amount}` : '₹0';
    } else if (hasPercent) {
      return item.percent ? `${item.percent}%` : '0%';
    }
    return '-';
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerLabel, { color: colors.subText }]}>{headers.left}</Text>
        <Text style={[styles.headerLabel, { color: colors.subText }]}>{headers.right}</Text>
      </View>

      {/* Table Rows */}
      {tableData.map((item: any, index: number) => {
        let leftValue = '';
        
        if (hasFromTo) {
          leftValue = `${formatDisplayValue(item, 'froma')} - ${formatDisplayValue(item, 'toa')}`;
        } else if (hasOperator) {
          leftValue = item.operator || item.opid || '-';
        } else if (column.includes('amount')) {
          leftValue = formatDisplayValue(item, 'amount');
        } else {
          leftValue = formatDisplayValue(item, column[0]);
        }

        const rightValue = getRightValue(item);

        return (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.value, { color: colors.text }]}>{leftValue}</Text>
            <Text style={[styles.amount, { color: colors.text }]}>{rightValue}</Text>
          </View>
        );
      })}
    </View>
  );
};

export default function BBPSCommissionScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const [commissionPlan, setCommissionPlan] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Polling timer reference
  const pollingTimerRef = useRef<NodeJS.Timeout | any>(null);

  const colors = {
    background: isDark ? "#021a22" : "#eef5f9",
    header1: isDark ? "#032834" : "#350083",
    header2: isDark ? "#05445E" : "#4F1CA9",
    card: isDark ? "#0f2b33" : "#ffffff",
    text: isDark ? "#ffffff" : "#111827",
    subText: isDark ? "#9ca3af" : "#6b7280",
  };

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
      fetchCommissionData(true); // Silent fetch for polling
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
      const cachedData = await AsyncStorage.getItem(STORAGE_KEYS.COMMISSION_DATA);
      const initialFetchDone = await AsyncStorage.getItem(STORAGE_KEYS.INITIAL_FETCH_DONE);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        setCommissionPlan(parsedData);
      }
      
      // Only fetch from API if initial fetch hasn't been done
      if (!initialFetchDone) {
        await fetchCommissionData(false);
      } else {
        // Start polling for updates
        startPolling();
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
      // If error loading cache, fetch fresh data
      await fetchCommissionData(false);
    }
  };

  // Save commission data to AsyncStorage
  const saveCommissionToCache = async (data: any[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COMMISSION_DATA, JSON.stringify(data));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_FETCH_TIME, new Date().toISOString());
    } catch (error) {
      console.error('Error saving commission to cache:', error);
    }
  };

  // Mark initial fetch as done
  const markInitialFetchDone = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INITIAL_FETCH_DONE, 'true');
    } catch (error) {
      console.error('Error marking initial fetch:', error);
    }
  };

  const fetchCommissionData = async (isPolling: boolean = false) => {
    // Only show loading indicator for non-polling fetches and first load
    if (!isPolling && loading === false) {
      setLoading(true);
    }
    
    try {
      const data = await getComissionPlan();
      
      if (data?.status === "SUCCESS") {
        const commissionData = data?.data?.commssionSlab || [];
        setCommissionPlan(commissionData);
        
        // Save to cache
        await saveCommissionToCache(commissionData);
        
        // Mark initial fetch as done if this is the first successful fetch
        const initialFetchDone = await AsyncStorage.getItem(STORAGE_KEYS.INITIAL_FETCH_DONE);
        if (!initialFetchDone) {
          await markInitialFetchDone();
          // Start polling after first successful fetch
          startPolling();
        }
        
        if (!isPolling) {
          // console.log('Fetched fresh commission data:', commissionData.length);
        }
      } else {
        if (!isPolling) {
          Alert.alert("Error", data?.message || "Failed to fetch commission plan");
        } else {
          // console.log('Polling fetch failed:', data?.message);
        }
      }
    } catch (error) {
      console.error("Error fetching commission plan:", error);
      if (!isPolling) {
        Alert.alert("Error", "Something went wrong");
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  // Manual refresh (with pull-to-refresh)
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCommissionData(false);
    setRefreshing(false);
  };

  // Filter out empty table data if needed
  const filteredPlans = commissionPlan.filter((plan: any) => plan.tableData && plan.tableData.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ================= HEADER ================= */}
       <HeaderSection title="Commission Plan" />
         

      {/* ================= CONTENT ================= */}
      {loading && filteredPlans.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.header1} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading commission plans...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.header1]}
              tintColor={colors.header1}
            />
          }
        >
          {filteredPlans.length > 0 ? (
            filteredPlans.map((plan: any, index: number) => (
              <View key={index} style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {plan.label.toUpperCase()}
                </Text>
                <CommissionCard plan={plan} colors={colors} />
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={colors.subText} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No commission plans available
              </Text>
            </View>
          )}
          <View style={styles.bottomSpace} />
        </ScrollView>
      )}
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  refreshBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  headerSub: {
    marginTop: 4,
    fontSize: 14,
    color: "#e5e7eb",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  card: {
    width: width - 32,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 4,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },
  bottomSpace: {
    height: 30,
  },
});