import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
  ActivityIndicator,
  Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";

import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import EvilIcons from '@expo/vector-icons/EvilIcons';

import { fetchBalance } from "@/hooks/servies/serviceApi";

const COLORS = {
  light: {
    primary: "#6366F1",
    secondary: "#8B5CF6",
    accent: "#EC4899",
    background: "#F9FAFB",
    card: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
  },
  dark: {
    primary: "#818CF8",
    secondary: "#A78BFA",
    accent: "#F472B6",
    background: "#111827",
    card: "#1F2937",
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    border: "#374151",
  },
};

export default function BalanceCard() {
  const [lodingState, setLodingState] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? COLORS.dark : COLORS.light;
  const dispatch = useDispatch();
  const userData = useSelector((state:any) => state.auth.user);
  const userRoleId = userData?.data?.accountkycstatus?.role;
  const profilDtaa = useSelector((state:any) => state.customer.list)
  const userID = profilDtaa?.data?.profile?.username;
  const userRole = useSelector((state:any) => state.services.stateRole)


 
  
  const balancedata = useSelector((state: any) => state.wallet.balance);
  const router = useRouter();

  const scale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  // Get user's role ID from userData
  

  // Fetch balance on component mount
  useEffect(() => {
    fetchBalance(dispatch);
  }, [dispatch,userRoleId]);

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSequence(withSpring(1.05), withSpring(1));
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleRefreshBtn = async () => {
    setLodingState(true);
    try {
      const res = await fetchBalance(dispatch);
      if (res.status === "SUCCESS") {
        setLodingState(false);
      } else {
        setLodingState(false);
        Alert.alert("Error", "Failed to refresh balance");
      }
    } catch  {
      setLodingState(false);
      Alert.alert("Error", "Failed to refresh balance");
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(600).springify()}>
      <Animated.View style={[styles.container, cardAnimatedStyle]}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={[theme.primary, theme.secondary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
            locations={[0.2, 0.6, 1]}
          >
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />

            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="wallet-outline" size={20} color="rgba(255,255,255,0.9)" />
                <Text style={styles.walletLabel}>Wallet</Text>
              </View>
              <View style={styles.idBadge}>
                <Text style={styles.idText}>{userRole?.length > 1 ? userRole : userID }</Text>
              </View>
            </View>

            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <View style={styles.balanceRow}>
                <Animated.Text
                  entering={FadeInUp.duration(800).delay(200)}
                  style={styles.balance}
                >
                  {lodingState ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    "₹" + (Number(balancedata?.walletBalance).toFixed(2) || 0.00)
                  )}
                </Animated.Text>
                <TouchableOpacity onPress={handleRefreshBtn} style={styles.refreshButton}>
                  {!lodingState && <EvilIcons name="refresh" size={45} color="white" />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <Animated.View style={[styles.buttonWrapper, buttonAnimatedStyle]}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => router.push("/screen/AddFund")}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    <View style={styles.buttonContent}>
                      <Ionicons name="add-circle" size={22} color="#fff" />
                      <Text style={styles.buttonText}>Add Money</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "95%",
    alignSelf: "center",
    marginVertical: 10,
  },
  card: {
    borderRadius: 8,
    padding: 24,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  decorativeCircle1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: -40,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "600",
  },
  idBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  idText: {
    color: "#fff",
    fontSize: 12,
  },
  balanceContainer: {
    marginBottom: 1,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
    marginBottom: 6,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balance: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    flex: 1,
  },
  refreshButton: {
    marginLeft: 10,
    padding: 5,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  buttonContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});