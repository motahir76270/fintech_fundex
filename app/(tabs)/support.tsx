import React, { useCallback, useRef, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Animated,
  Linking,
  RefreshControl,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import Navbar from "@/components/navbar/navbar";
import CustomDrawer from "@/components/navbar/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";
import { useCompany } from "@/constants/string";

export default function ContactUsScreen() {
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const company = useCompany()
  const userdata = useSelector((state: any) => state.auth.user);
  const supportData = userdata?.data?.accountkycstatus;
  console.log(supportData);
  
  const colorScheme = useColorScheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const startAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    startAnimation();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      startAnimation();
      setRefreshing(false);
    }, 1500);
  }, []);

  const theme = {
    light: {
      cardBg: "#ffffff",
      textPrimary: "#1a1a1a",
      textSecondary: "#666666",
      label: "#444444",
      divider: "#f0f0f0",
      surface: "#f8f9fa",
      accent: "#007AFF",
    },
    dark: {
      cardBg: "#0f2d3a",
      textPrimary: "#ffffff",
      textSecondary: "#b0bec5",
      label: "#e0e0e0",
      divider: "#1e3d4a",
      surface: "#0b2530",
      accent: "#0A84FF",
    },
  };

  const colors = colorScheme === "dark" ? theme.dark : theme.light;

  const handleCall = () => {
    if (supportData?.supportphone) {
      Linking.openURL(`tel:+91${supportData.supportphone}`);
    }
  };

  const handleEmail = () => {
    if (supportData?.supportmail) {
      Linking.openURL(`mailto:${supportData.supportmail}`);
    }
  };

  const handleMap = () => {
    Linking.openURL(
      "https://maps.google.com/?q=Rzc-112/1-A,Nangloi,NewDelhi-110041"
    );
  };

  const contactInfo = useMemo(
    () => [
      {
        id: 1,
        label: "Mobile Number",
        value: supportData?.supportphone || "Not Available",
        icon: "phone",
        color: "#007AFF",
        action: handleCall,
      },
      {
        id: 2,
        label: "Email Address",
        value: supportData?.supportmail || "Not Available",
        icon: "mail",
        color: "#FF9500",
        action: handleEmail,
      },
      {
        id: 3,
        label: "Office Address",
        value:supportData?.address,
        icon: "map-pin",
        color: "#34C759",
        action: handleMap,
      },
    ],
    [supportData]
  );

  // Optional loading UI
  if (!supportData) {
    return (
      <View style={styles.loader}>
        <Text>Loading support details...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={
        colorScheme === "light"
          ? ["#f8fafc", "#ffffff", "#f1f5f9"]
          : ["#011016", "#02232f", "#00141d"]
      }
      style={styles.container}
    >
      <Navbar open={open} setOpen={setOpen} title="Support" />
      <CustomDrawer visible={open} onClose={() => setOpen(false)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colorScheme === "light" ? "#000" : "#fff"}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingHorizontal: 20,
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={company.supportIcon}
              style={styles.image}
            />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Get in Touch
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We are here to help you with any questions
            </Text>
          </View>

          {/* Contact Cards */}
          {contactInfo.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              onPress={item.action}
              activeOpacity={0.7}
              style={[styles.contactCard, { backgroundColor: colors.cardBg }]}
            >
              <Feather name={item.icon} size={22} color={item.color} />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={{ color: colors.label, fontSize: 13 }}>
                  {item.label}
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
                  {item.value}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.accent }]}
            onPress={handleEmail}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>Send Message</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    alignItems: "center",
    marginVertical: 20,
  },

  image: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 6,
  },

  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 4,
  },

  ctaButton: {
    marginTop: 30,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },

  ctaText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});