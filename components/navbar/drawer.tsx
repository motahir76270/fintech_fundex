import { useCompany } from "@/constants/string";
import { aepsStatusCheck } from "@/hooks/aepsApi/kycApi";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
    ScrollView,
} from "react-native";
import { useDispatch } from "react-redux";

const { width, height } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.7;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function CustomDrawer({ visible, onClose }: Props) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const router = useRouter();
  const colorScheme = useColorScheme();
  const company = useCompany();
  const dispatch = useDispatch();

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  });

  const kycStatusbtn = async()=> {
     await aepsStatusCheck(dispatch);
     onClose();
  }

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* Drawer Panel */}
      <Animated.View
        style={[
          styles.drawer,
          { backgroundColor: colorScheme === "light" ? "#1f0744" : "#032834" },
          { transform: [{ translateX }] },
        ]}
      >
        {/* Close Button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color="#dadada" />
        </TouchableOpacity>

        {/* Header / Profile */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Image source={company.logo} style={styles.avatarImage} />
          </View>
          <Text style={styles.username}> {company.name} </Text>
          {/* <Text style={styles.usertag} >Fintch App</Text> */}
        </View>

        {/* Menu Items - Made Scrollable */}
        <ScrollView 
          style={styles.menuContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuContent}
        >
          <TouchableOpacity
            style={styles.menuItemLight}
            onPress={() => router.push("/screen/profile")}
          >
            <Ionicons name="person-outline" size={22} color="#1e88e5" />
            <Text style={styles.menuTextLight}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemLight}
            onPress={() => router.push("/screen/collection/cashpoint")}
          >
            <Ionicons name="person-outline" size={22} color="#1e88e5" />
            <Text style={styles.menuTextLight}>UPI Cashpoint</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemLight}
            onPress={() => router.push("/screen/changePassword")}
          >
            <Ionicons name="lock-closed-outline" size={22} color="#1e88e5" />
            <Text style={styles.menuTextLight}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemLight}
            onPress={() => router.push("/screen/changePin")}
          >
            <Ionicons name="key-outline" size={22} color="#1e88e5" />
            <Text style={styles.menuTextLight}>Change Pin</Text>
          </TouchableOpacity>

           <TouchableOpacity
              style={styles.menuItemLight}
              onPress={() => router.push("/screen/addMember")}
            >
            <Ionicons name="people-outline" size={22} color="#1e88e5" />
            <Text style={styles.menuTextLight}>Add Member</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemLight}
            onPress={() => router.push("/screen/cardId")}
          >
            <Ionicons name="card" size={22} color="#1e88e5" />
            <Text style={styles.menuTextLight}>User ID card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemLight}
            onPress={() => router.push("/screen/commisionPlan")}
          >
            <Ionicons name="wallet-outline" size={22} color="#1e88e5" />
            <Text style={styles.menuTextLight}>Commission Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemLight}
            onPress={kycStatusbtn}
          >
            <Ionicons name="document-text-outline" size={22} color="#1e88e5" />
            <Text style={styles.menuTextLight}>KYC Status Check </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemLight}
            onPress={() => router.push("/screen/raiseTicket")}
          >
            <Ionicons name="help-circle-outline" size={22} color="#1e88e5" />
            <Text style={styles.menuTextLight}>Raised Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemLight}
            onPress={() => router.push("/screen/policy")}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#1e88e5"
            />
            <Text style={styles.menuTextLight}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemLight}
            onPress={() => router.push("/screen/termsCondition")}
          >
            <Ionicons name="reader-outline" size={22} color="#1e88e5" />
            <Text style={styles.menuTextLight}>Terms & Conditions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItemLight}
            onPress={() => router.push("/screen/refundCancil")}
          >
            <MaterialCommunityIcons name="cancel" size={24} color="#1e88e5" />
            <Text style={styles.menuTextLight}>Refund & Cancellation</Text>
          </TouchableOpacity> 
          
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Reserved right</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 999999,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: "94%",
    // backgroundColor: '#041a22', // dark semi-transparent
    paddingHorizontal: 25,
    paddingTop: 50,
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 99999,
    marginTop: 38,
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 200,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 35,
    backgroundColor: "none",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 24,
  },
  username: {
    color: "#d3d3d3",
    fontSize: 18,
    fontWeight: "700",
  },
  usertag: {
    color: "#bbb3b3",
    fontSize: 12,
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingBottom: 160,
  },
  menuItemLight: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 0.2,
    borderBottomColor: "#dadada",
  },

  menuTextLight: {
    marginLeft: 15,
    fontSize: 15,
    color: "#b1a9a9",
    fontWeight: "500",
  },

  footer: {
    paddingVertical: 20,
    borderTopWidth: 0.5,
    borderTopColor: "#333",
    alignItems: "center",
  },
  footerText: {
    color: "#888",
    fontSize: 12,
  },
});