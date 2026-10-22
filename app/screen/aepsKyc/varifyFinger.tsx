import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";
import { varifyAepsKycFingerApiCall } from "@/hooks/aepsApi/kycApi";
import useFingerprintCapture from "@/hooks/use-aeps-kyc-fingerprint";
import useFaceAuthCapture from "@/hooks/use-face-auth";
import { useDispatch, useSelector } from "react-redux";
import { setPidOptionWadh } from "@/redux/aeps/aepsSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";

const theme = {
  light: {
    cardBg: "#ffffff",
    textPrimary: "#1a1a1a",
    textSecondary: "#666666",
    label: "#444444",
    divider: "#f0f0f0",
    surface: "#350083",
    accent: "#007AFF",
    inputBg: "#f2f2f2",
    inputBorder: "#e0e0e0",
    success: "#34C759",
    error: "#FF3B30",
  },
  dark: {
    cardBg: "#1c1c1e",
    textPrimary: "#ffffff",
    textSecondary: "#8e8e93",
    label: "#e0e0e0",
    divider: "#f0f0f0",
    surface: "#032834",
    accent: "#0A84FF",
    inputBg: "#1c1c1e",
    inputBorder: "#2c2c2e",
    success: "#30D158",
    error: "#FF453A",
  },
};

const VarifyFinger = () => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? theme.dark : theme.light;
  const dispatch = useDispatch();
  const { captureFingerprint } = useFingerprintCapture();
  const { captureFace } = useFaceAuthCapture();
  const { user } = useSelector((state: any) => state.auth);
  const aadhaarNumber = user?.data?.accountkycstatus?.adhaar || "";
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationType, setVerificationType] = useState<"finger" | "face" | null>(null);

  const validateAadhaar = (aadhaar: string): boolean => {
    const digits = aadhaar.replace(/\s/g, "");
    return digits.length === 12 && /^\d+$/.test(digits);
  };

  const handleVerify = async (type: "finger" | "face") => {
    // if (!validateAadhaar(aadhaarNumber)) {
    //   Alert.alert("Invalid Aadhaar", "Please enter a valid 12-digit Aadhaar number");
    //   return;
    // }
    
    setIsVerifying(true);
    setVerificationType(type);
    
    try {
      let biometricData = null;
      
      if (type === "finger") {
        biometricData = await captureFingerprint();
        if (!biometricData) {
          Alert.alert("Failed", "Fingerprint not captured successfully");
          setIsVerifying(false);
          return;
        }
      } else {
        biometricData = await captureFace();
        if (!biometricData) {
          Alert.alert("Failed", "Face not captured successfully");
          setIsVerifying(false);
          return;
        }
      }
      
      if (biometricData) {
        await varifyAepsKycFingerApiCall(biometricData, dispatch);
      }
    } catch (error) {
      Alert.alert("Error", "Verification failed. Please try again.");
      console.error(error);
    } finally {
      setTimeout(() => {
        setIsVerifying(false);
        setVerificationType(null);
      }, 2000);
    }
  };

 

  useEffect(() => {
    const fetchAepsStatus = async () => {
    const aspaResSatatusData = await AsyncStorage.getItem("aepsStatus");
    dispatch(setPidOptionWadh(JSON.parse(aspaResSatatusData as any)));
  }
    fetchAepsStatus();
  }, [dispatch]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.divider }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider ,backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.divider} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.divider }]}>
          KYC Verification
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
          {/* Icon + Title */}
          <View style={styles.titleRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent + "15" }]}>
              <FontAwesome5 name="user-shield" size={24} color={colors.accent} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Aadhaar Verification
            </Text>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Verify your identity using biometric authentication. Choose between fingerprint or face scan.
          </Text>

          {/* Aadhaar Info Card */}
          <View style={[styles.aadhaarCard, { 
            backgroundColor: colors.accent + "10",
            borderColor: colors.accent + "20"
          }]}>
            <FontAwesome5 name="id-card" size={20} color={colors.accent} />
            <View style={styles.aadhaarDetails}>
              <Text style={[styles.aadhaarLabel, { color: colors.textSecondary }]}>
                Aadhaar Number
              </Text>
              <Text style={[styles.aadhaarNumber, { color: colors.textPrimary }]}>
                { `XXXX-XXXX-${aadhaarNumber?.slice(8)}` || "XXXX XXXX xxxx"}
              </Text>
            </View>
            {aadhaarNumber && validateAadhaar(aadhaarNumber) && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.success + "15" }]}>
                <MaterialIcons name="verified" size={14} color={colors.success} />
                <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
              </View>
            )}
          </View>

          {/* Status */}
          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, { backgroundColor: colors.accent + "15" }]}>
              <MaterialIcons name="pending-actions" size={18} color={colors.accent} />
            </View>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              Ready for biometric verification
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Biometric Options */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Select Verification Method
          </Text>

          {/* Fingerprint Button */}
          <TouchableOpacity
            style={[
              styles.biometricButton,
              { 
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }
            ]}
            onPress={() => handleVerify("finger")}
            disabled={isVerifying}
          >
            <View style={styles.biometricButtonContent}>
              <View style={[styles.biometricIcon, { backgroundColor: colors.accent + "15" }]}>
                <Ionicons name="finger-print" size={28} color={colors.accent} />
              </View>
              <View style={styles.biometricTextContainer}>
                <Text style={[styles.biometricTitle, { color: colors.textPrimary }]}>
                  Fingerprint Scan
                </Text>
                <Text style={[styles.biometricDescription, { color: colors.textSecondary }]}>
                  Use your fingerprint sensor
                </Text>
              </View>
              {isVerifying && verificationType === "finger" ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              )}
            </View>
          </TouchableOpacity>

          {/* Face Scan Button */}
          <TouchableOpacity
            style={[
              styles.biometricButton,
              { 
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
              }
            ]}
            onPress={() => handleVerify("face")}
            disabled={isVerifying}
          >
            <View style={styles.biometricButtonContent}>
              <View style={[styles.biometricIcon, { backgroundColor: colors.accent + "15" }]}>
                <Ionicons name="camera" size={28} color={colors.accent} />
              </View>
              <View style={styles.biometricTextContainer}>
                <Text style={[styles.biometricTitle, { color: colors.textPrimary }]}>
                  Face Scan
                </Text>
                <Text style={[styles.biometricDescription, { color: colors.textSecondary }]}>
                  Use your camera for face recognition
                </Text>
              </View>
              {isVerifying && verificationType === "face" ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              )}
            </View>
          </TouchableOpacity>

          {/* Info Note */}
          <View style={[styles.infoNote, { backgroundColor: colors.accent + "08" }]}>
            <Ionicons name="information-circle" size={18} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Make sure you have good lighting for face scan or clean fingerprint sensor
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default VarifyFinger;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  card: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  description: {
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
  },
  aadhaarCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  aadhaarDetails: {
    flex: 1,
    marginLeft: 12,
  },
  aadhaarLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  aadhaarNumber: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  biometricButton: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  biometricButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  biometricIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  biometricTextContainer: {
    flex: 1,
  },
  biometricTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  biometricDescription: {
    fontSize: 13,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});