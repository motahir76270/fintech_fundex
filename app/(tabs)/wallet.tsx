import CustomDrawer from "@/components/navbar/drawer";
import Navbar from "@/components/navbar/navbar";
import WalletHistory from "@/components/wallet/walletHistory";
import WalletToWallet from "@/components/wallet/walletToWallet";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";

const WalletTabs = () => {
  const [activeTab, setActiveTab] = useState<"history" | "transfer">("history");
  const [open, setOpen] = useState(false);
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";

  const colors = {
    tabBg: isDark ? "#0b1f28" : "#e6e6e6",
    activeTabBg: isDark? '#1d4152': "#4F1CA9",
    text: isDark ? "#eaeaea" : "#0a0808",
    activeText: "#ffffff",
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? ["#02232f", "#01090d", "#022733", "#000000"]
          : ["#dadada", "#ffffff"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <Navbar open={open} setOpen={setOpen} title="Wallet Transaction" />
      <CustomDrawer visible={open} onClose={() => setOpen(false)} />

      <View style={[styles.tabContainer, { backgroundColor: colors.tabBg }]}>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "history" && {
              backgroundColor: colors.activeTabBg,
            },
          ]}
          onPress={() => setActiveTab("history")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "history"
                    ? colors.activeText
                    : colors.text,
              },
            ]}
          >
            Wallet History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "transfer" && {
              backgroundColor: colors.activeTabBg,
            },
          ]}
          onPress={() => setActiveTab("transfer")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "transfer"
                    ? colors.activeText
                    : colors.text,
              },
            ]}
          >
            Wallet To Wallet
          </Text>
        </TouchableOpacity>

       



      </View>

      {activeTab === "history" ? <WalletHistory /> : <WalletToWallet /> }
    </LinearGradient>
  );
};

export default WalletTabs;

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    margin: 16,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth:1,
    borderColor:'#dadada'
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  tabText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
