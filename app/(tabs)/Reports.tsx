import CustomDrawer from "@/components/navbar/drawer";
import Navbar from "@/components/navbar/navbar";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useState, useEffect } from "react";
import Constants from 'expo-constants';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Icon mapping based on transaction codes
const getIconForCode = (type: string, color: string = "#fff") => {
  switch (type) {
    case "recharge":
      return <MaterialCommunityIcons name="cellphone-arrow-down" size={26} color={color} />;
    case "money-transfer":
      return <MaterialCommunityIcons name="bank-transfer" size={26} color={color} />;
    case "qtransfer":
      return <MaterialCommunityIcons name="flash" size={26} color={color} />;
    case "bbps":
      return <MaterialCommunityIcons name="file-document" size={26} color={color} />;
    case "wallet":
      return <MaterialCommunityIcons name="wallet-outline" size={26} color={color} />;
    case "payout":
      return <MaterialCommunityIcons name="hand-coin" size={26} color={color} />;
    case "pan":
      return <MaterialCommunityIcons name="card-account-details" size={26} color={color} />;
    case "cw":
      return <MaterialCommunityIcons name="cash" size={26} color={color} />;
    case "aeps":
      return <Ionicons name="finger-print-outline" size={24} color={color} />
    case "be":
      return <MaterialCommunityIcons name="bank" size={26} color={color} />;
    case "wallet-to-wallet":
      return <MaterialCommunityIcons name="swap-horizontal" size={26} color={color} />;
    case "wtwr":
      return <MaterialCommunityIcons name="swap-vertical" size={26} color={color} />;
    case "credit_debit":
      return <FontAwesome5 name="exchange-alt" size={24} color={color} />;
    default:
      return <MaterialCommunityIcons name="file-document" size={26} color={color} />;
  }
};

export default function TransactionReportsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isLight = colorScheme === "light";
  const baseURL = Constants.expoConfig?.extra?.API_URL;
  
  const getTransactionTypes = async () => {
    try {
      const datas = await AsyncStorage.getItem("user");
      const keydata = JSON.parse(datas as any);
       
      const res = await fetch(`${baseURL}/api/get-all-report-type`, {
        method: "GET",
        headers: {
          "headerKey": keydata.header_key,
          "headerToken": keydata.header_token,
        },
      });

       const data = await res.json();
   
      // Update with the API response data
      if (data?.status === "SUCCESS") {
        setTransactionTypes(data.data.reportItems);
      }else{
        Alert.alert("Failed", `${data?.message}`);
      }
    } catch {
      Alert.alert("Error", "Failed to fetch transaction types. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getTransactionTypes();
  }, []);  

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getTransactionTypes();
  }, []);

  const handleNavigation = (type: string, name: string) => {
    // Navigate to dynamic route with code as parameter
    router.push({
      pathname: `/history/:${type}`,
      params: { type, title: name }
    });
  };

  if (loading) {
    return (
      <LinearGradient
        colors={isLight ? ["#e5e5e5", "#ffffff"] : ["#02232f", "#01090d", "#000000"]}
        style={[styles.container, styles.centerContent]}
      >
        <Navbar open={open} setOpen={setOpen} title="Reports" />
        <CustomDrawer visible={open} onClose={() => setOpen(false)} />
        <ActivityIndicator size="large" color={isLight ? "#0B76A8" : "#cfd8dc"} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={
        isLight
          ? ["#e5e5e5", "#ffffff"]
          : ["#02232f", "#01090d", "#000000"]
      }
      style={styles.container}
    >
      <Navbar open={open} setOpen={setOpen} title="Reports" />
      <CustomDrawer visible={open} onClose={() => setOpen(false)} />


      <ScrollView
        contentContainerStyle={styles.buttonContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isLight ? "#000" : "#fff"}
          />
        }
      >
        {transactionTypes.map((item: any, index) => (
          <TouchableOpacity
            key={item.id || index}
            style={[
              styles.button,
              { backgroundColor: isLight ? "#ffffff" : "#061a22" },
            ]}
            activeOpacity={0.85}
            onPress={() => handleNavigation(item.type, item.name)}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isLight ? "#5c4bb9" : "#215872" },
              ]}
            >
              {getIconForCode(item.type)}
            </View>

            <Text
              style={[
                styles.buttonText,
                { color: isLight ? "#0B76A8" : "#cfd8dc" },
              ]}
            >
              {item.name}
            </Text>

            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={isLight ? "#999" : "#aaa"}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        ))}
        
        {transactionTypes.length === 0 && !loading && (
          <Text style={[styles.emptyText, { color: isLight ? "#666" : "#aaa" }]}>
            No transaction types available
          </Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 12,
  },
  buttonContainer: {
    paddingHorizontal: 8,
    paddingTop:10,
    paddingBottom: 160,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 4,
    marginBottom: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
});