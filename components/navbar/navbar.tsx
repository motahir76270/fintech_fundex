import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileModal from "../modal/userProfile";
import { useSelector } from "react-redux";
import { Image } from "expo-image";

export default function Navbar({
  open,
  setOpen,
  title,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  title: string;
}) {
  const colorScheme = useColorScheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [profileVisible, setProfileVisible] = useState(false);
  

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const isDark = colorScheme === "dark";

  const colors = {
    light: {
      primary: "#350083",
      gradientStart: "#4F1CA9",
      gradientEnd: "#350083",
      text: "#FFFFFF",
      icon: "#FFFFFF",
    },
    dark: {
      primary: "#032834",
      gradientStart: "#05445E",
      gradientEnd: "#032834",
      text: "#FFFFFF",
      icon: "#FFFFFF",
    },
  };

  const currentColors = isDark ? colors.dark : colors.light;

  const profileData = useSelector((state: any) => state.customer.list);
  const ProfileUrl = profileData.data?.profile?.profile;
   

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={currentColors.primary}
      />

      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[currentColors.gradientStart, currentColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <SafeAreaView edges={["top"]} style={styles.safeArea}>
            <View style={styles.content}>
              {/* Menu */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setOpen(true)}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={open ? "close" : "menu"}
                    size={28}
                    color={currentColors.icon}
                  />
                </View>
              </TouchableOpacity>

              {/* Title */}
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: currentColors.text }]}>
                  {title}
                </Text>
                <View style={styles.titleUnderline} />
              </View>

              {/* Profile */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setProfileVisible(true)}
              >
                <View style={styles.profileContainer}>
                  {ProfileUrl ? (
                     <Image source={{ uri: ProfileUrl }} style={styles.profileImage} />
                  ) : ( 
                      <Ionicons name="person-circle" size={40} color={currentColors.icon} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      {/* Profile Modal */}
      <ProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    zIndex: 100,
  },
  gradient: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
  },
  safeArea: {
    backgroundColor: "transparent",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === "ios" ? 10 : 16,
    minHeight: Platform.OS === "ios" ? 90 : 70,
  },
  iconButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  titleContainer: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 2,
    marginTop: 4,
  },
  profileContainer: {
    padding: 2,
    borderRadius: 22,
    backgroundColor: "rgba(201, 193, 193, 0.1)",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 26,
    borderColor:"rgba(211, 204, 204, 0.3)",
    borderWidth: 1,
  },
});
