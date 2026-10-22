import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
  Animated,
  Easing,
  useColorScheme,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/redux/auth/authSlice";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const { width, height } = Dimensions.get("window");

export default function ProfileModal({ visible, onClose }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const dispatch = useDispatch();
  const isDark = colorScheme === "dark";
  const profileData = useSelector((state: any) => state.customer.list);
  const userData = profileData.data?.profile;

  const themeColors = isDark
    ? {
        primary: "#6366f1",
        primaryLight: "#818cf8",
        gradientStart: "#4f46e5",
        gradientEnd: "#7c3aed",
        text: "#FFFFFF",
        textSecondary: "#94a3b8",
        icon: "#818cf8",
        background: "#0f172a",
        overlay: "rgba(0, 0, 0, 0.8)",
        card: "#1e293b",
        cardLight: "#334155",
        subtitle: "#94a3b8",
        divider: "#334155",
        optionBackground: "#1e293b",
        optionHover: "#2d3a4f",
        border: "#334155",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
      }
    : {
        primary: "#4f46e5",
        primaryLight: "#6366f1",
        gradientStart: "#4f46e5",
        gradientEnd: "#7c3aed",
        text: "#0f172a",
        textSecondary: "#475569",
        icon: "#4f46e5",
        background: "#fff",
        overlay: "rgba(0, 0, 0, 0.5)",
        card: "#fff",
        cardLight: "#f8fafc",
        subtitle: "#64748b",
        divider: "#e2e8f0",
        optionBackground: "#f8fafc",
        optionHover: "#f1f5f9",
        border: "#e2e8f0",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
      };

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const animateModal = useCallback(
    (show: boolean) => {
      if (show) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: height,
            duration: 250,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
    [fadeAnim, slideAnim, scaleAnim],
  );

  useEffect(() => {
    animateModal(visible);
  }, [visible, animateModal]);

  const handleProfileNavigation = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      setTimeout(() => router.push("/screen/profile"), 100);
    });
  }, [fadeAnim, onClose, router]);

  const handleLogoutBTN = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("user");
            dispatch(setUser(""));
            router.replace("/(auth)/login");
          } finally  {
            
          }
        },
        style: "destructive",
      },
    ]);
  };

  const menuOptions = [
    {
      id: 1,
      title: "View Profile",
      description: "See and edit your profile details",
      icon: "person-outline",
      onPress: handleProfileNavigation,
    },
    {
      id: 3,
      title: "Help & Support",
      description: "Get help and contact support",
      icon: "help-circle-outline",
      onPress: () => {
        router.push("/(tabs)/support");
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={40}
            style={styles.blurView}
            tint={isDark ? "dark" : "light"}
          />
        ) : (
          <View
            style={[
              styles.androidOverlay,
              { backgroundColor: themeColors.overlay },
            ]}
          />
        )}

        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            },
          ]}
        >
          <LinearGradient
            colors={[themeColors.gradientStart, themeColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.contentContainer}>
            <View style={styles.avatarContainer}>
              <View
                style={[
                  styles.avatarWrapper,
                  { borderColor: themeColors.primary },
                ]}
              >
                {userData?.profile ? (
                  <Image
                    source={{ uri: userData?.profile }}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: themeColors.primary,
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <Text
                      style={{ color: "#fff", fontSize: 24, fontWeight: "600" }}
                    >
                      {userData?.name
                        ? userData.name
                            .split(" ")
                            .map((n: any) => n[0])
                            .join("")
                            .substring(0, 2)
                        : "NA"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: themeColors.text }]}>
                  Name: {userData?.name || "User Name"}
                </Text>
                <View style={styles.userIdContainer}>
                  <Ionicons
                    name="finger-print-outline"
                    size={14}
                    color={themeColors.primary}
                  />
                  <Text
                    style={[styles.userId, { color: themeColors.subtitle }]}
                  >
                    ID: {userData?.username || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: themeColors.divider }]}
            />

            <View style={styles.optionsContainer}>
              {menuOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionButton,
                    { backgroundColor: themeColors.optionBackground },
                  ]}
                  onPress={option.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: isDark ? "#2d3a4f" : "#e0e7ff" },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={22}
                      color={themeColors.primary}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text
                      style={[styles.optionTitle, { color: themeColors.text }]}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: themeColors.subtitle },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={themeColors.subtitle}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.logoutButton,
                { borderColor: themeColors.divider },
              ]}
              onPress={handleLogoutBTN}
              activeOpacity={0.7}
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color={themeColors.error}
              />
              <Text style={[styles.logoutText, { color: themeColors.error }]}>
                Logout
              </Text>
            </TouchableOpacity>

            <Text style={[styles.versionText, { color: themeColors.subtitle }]}>
              Version 1.0.0
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  androidOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 1,
  },
  headerGradient: {
    height: 120,
    width: "100%",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  contentContainer: {
    padding: 24,
    paddingTop: 0,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -40,
    marginBottom: 20,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  userIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userId: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 20,
    width: "100%",
  },
  optionsContainer: {
    width: "100%",
    marginBottom: 24,
    gap: 8,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  versionText: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.6,
  },
});
