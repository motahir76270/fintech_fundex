// src/screens/TwoFactorAuthScreen.tsx

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Modal,
} from "react-native";

import { getDeviceApiCall, twoFactAuthAepsKycApiCall } from "@/hooks/aepsApi/kycApi";

import useFingerprintCapture from "@/hooks/use-aeps-fingerprint";
import useFaceAuthCapture from '@/hooks/use-face-auth'

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";
import { onLocation } from "@/hooks/use-location";
import { useCompany } from "@/constants/string";

const twoFactorSchema = z.object({
  device: z.string().min(1, "Please select a device"),
});

type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

export default function TwoFactorAuthScreen() {
  const { captureFingerprint } = useFingerprintCapture();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New state for loading overlay
  const location = useSelector((state: any) => state.services.getLocation);
  const dispatch = useDispatch();
  const company = useCompany();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    background: isDark ? "#021a22" : "#eaf3f6",
    header: isDark ? "#032834" : "#2a0888",
    card: isDark ? "#0f2b33" : "#ffffff",
    text: isDark ? "#ffffff" : "#000000",
    border: isDark ? "#2f4f58" : "#ccc",
    button: isDark ? "#0b4a5a" : "#350083",
    buttonDisabled: isDark ? "#0a3a45" : "#9ca3af",
    placeholder: "#9ca3af",
    operatorItem: isDark ? "#1a3a45" : "#ec6a6a",
    overlay: "rgba(0, 0, 0, 0.7)",
  };

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const  { captureFace }= useFaceAuthCapture();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      device: "",
    },
    mode: "onChange",
  });

  const handleDeviceBtn = async () => {
    try {
      setLoadingDevices(true);
      setIsLoading(true); // Show loading overlay
      const res = await getDeviceApiCall();
      
      if (res?.status === "SUCCESS") {
        // Transform the data to match DropDownPicker format
        const transformedItems = res?.data?.rdname?.map((device: any) => ({
          label: device.name, // Display name in dropdown
          value: device.id.toString(), // Store the ID as value
        }));
        
        setItems(transformedItems);
      } else {
        Alert.alert(`${res?.status}`, `${res?.message}`);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      Alert.alert("Error", "Failed to fetch devices");
    } finally {
      setLoadingDevices(false);
      setIsLoading(false); // Hide loading overlay
    }
  };

  const onSubmit = async (data: TwoFactorFormData) => {
    try {
      setIsSubmitting(true);
      setIsLoading(true); // Show loading overlay
      if(!location.latitude){
        Alert.alert('warning',' Please on mobile location');
        onLocation(dispatch)
      }
      // Capture fingerprint
      const PidData = await captureFingerprint();
      if (PidData) {
      const res =   await twoFactAuthAepsKycApiCall(PidData, location); 
          if(res.status === "SUCCESS"){
          Alert.alert(`${res?.status}`, `${res?.message}`)
          router.replace('/(tabs)')
          }else{
             Alert.alert(`${res?.status}`, `${res?.message}`)
         }
      }else{
        Alert.alert(`ERROR`, `Finger not capture`);
      }
    } catch  {
      Alert.alert("Error", "Failed to authenticate. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsLoading(false); // Hide loading overlay
    }
  };

  const handleFaceAuthBtn = async () => {
    try {
      setLoadingDevices(true);
      setIsLoading(true); // Show loading overlay
        if(!location.latitude){
        Alert.alert('warning',' Please on mobile location');
        onLocation(dispatch)
      }
      
      const faceData =  await captureFace();
      if(faceData){
      const res =   await twoFactAuthAepsKycApiCall(faceData, location); 
           if(res.status === "SUCCESS"){
          Alert.alert(`${res?.status}`, `${res?.message}`)
          router.replace('/(tabs)')
          }else{
             Alert.alert(`${res?.status}`, `${res?.message}`)
             console.log(res.message);
         }
      }else{
        Alert.alert("Failed", "face not Captured")
      }
   } catch  {
       Alert.alert("Faield", "Something went wroung")
    }finally{
        setLoadingDevices(false);
        setIsLoading(false); // Hide loading overlay
    }
  }

  

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      backgroundColor: colors.header,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },

    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },

    logoContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    },

    iconContainer: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },

    logoText: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "bold",
      marginLeft: 8,
    },

    headerTextContainer: {
      alignItems: "center",
      marginTop: 6,
    },

    headerSubtitle: {
      color: "#fff",
      fontSize: 13,
      opacity: 0.85,
    },

    headerTitle: {
      color: "#fff",
      fontSize: 22,
      fontWeight: "bold",
      marginTop: 3,
    },

    content: {
      flex: 1,
      padding: 20,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 22,
      elevation: 4,
    },

    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 20,
      textAlign: "center",
    },

    label: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },

    dropdownContainer: {
      zIndex: 1000,
    },

    dropdown: {
      borderColor: errors.device ? "#ff4444" : colors.border,
      borderRadius: 8,
      minHeight: 50,
    },

    dropdownText: {
      color: colors.text,
    },

    dropdownPlaceholder: {
      color: colors.placeholder,
    },

    dropdownList: {
      borderColor: colors.border,
    },

    errorText: {
      color: "#ff4444",
      fontSize: 12,
      marginTop: 4,
    },

    submitButton: {
      backgroundColor: isSubmitting ? colors.buttonDisabled : colors.button,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 20,
      flexDirection: "row",
      justifyContent: "center",
      opacity: isSubmitting ? 0.8 : 1,
    },

    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },

    aepsButton: {
      marginTop: 20,
      backgroundColor: colors.operatorItem,
      borderRadius: 12,
      padding: 15,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
    },

    aepsButtonText: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
      color: colors.text,
    },

    activityIndicator: {
      marginRight: 8,
    },

    // Loading Overlay Styles
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    loadingContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      minWidth: 150,
    },
    loadingText: {
      color: colors.text,
      marginTop: 12,
      fontSize: 14,
      fontWeight: '500',
    },
    largeActivityIndicator: {
      transform: [{ scale: 1.2 }],
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* HEADER */}
        <SafeAreaView style={styles.header} edges={["top"]}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={isSubmitting || isLoading}
            >
             <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="bank" size={24} color="#fff" />
              </View>
              <Text style={styles.logoText}>{company.name}</Text>
            </View>

            <View style={{ width: 24 }} />
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSubtitle}>BANKING SERVICES</Text>
            <Text style={styles.headerTitle}>2FA Authentication</Text>
          </View>
        </SafeAreaView>

        {/* CONTENT */}
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Authentication Device</Text>

            <Text style={styles.label}>Device</Text>

            <Controller
              control={control}
              name="device"
              render={({ field: { onChange, value } }) => (
                <DropDownPicker
                  open={open}
                  value={value}
                  items={items}
                  setOpen={setOpen}
                  setItems={setItems}
                  setValue={(callback) => {
                    const newValue = callback(value);
                    onChange(newValue);
                  }}
                  placeholder={loadingDevices ? "Loading devices..." : "Choose a device"}
                  style={styles.dropdown}
                  textStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  dropDownContainerStyle={styles.dropdownList}
                  listMode="SCROLLVIEW"
                  zIndex={3000}
                  zIndexInverse={1000}
                  disabled={isSubmitting || loadingDevices || isLoading}
                  onPress={() => {
                    // Only fetch if items array is empty
                    if (items.length === 0) {
                      handleDeviceBtn();
                    }
                  }}
                  loading={loadingDevices}
                  activityIndicatorColor={colors.button}
                />
              )}
            />

            {errors.device && (
              <Text style={styles.errorText}>{errors.device.message}</Text>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isValid || isLoading}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                    style={styles.activityIndicator}
                  />
                  <Text style={styles.submitButtonText}>PROCESSING...</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="finger-print-outline"
                    size={30}
                    color="#fff"
                  />
                  <Text style={styles.submitButtonText}>Finger verify</Text>
                </>
              )}
            </TouchableOpacity>

             <TouchableOpacity
              style={styles.submitButton}
              onPress={handleFaceAuthBtn}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                    style={styles.activityIndicator}
                  />
                  <Text style={styles.submitButtonText}>PROCESSING...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons   
                    name="line-scan" // closest icon for face scan
                    size={32} 
                    color="#fff" 
                   />

                  <Text style={styles.submitButtonText}>Face Authentication</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* Loading Overlay Modal */}
      <Modal
        transparent={true}
        visible={isLoading}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              size="large" 
              color={colors.button} 
              style={styles.largeActivityIndicator}
            />
            <Text style={styles.loadingText}>
              {loadingDevices ? "Loading devices..." : "Processing..."}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}