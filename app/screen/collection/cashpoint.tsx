// import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
    ScrollView,
    Platform,
    Modal,
    FlatList,
    Pressable,
} from "react-native";
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Network from 'expo-network';

import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useCompany } from "@/constants/string";
import HeaderSection from "@/components/navbar/header";
import QRCodeModal from "@/components/modal/cashpoint/qrCodeModal";
import { FullScreenLoader } from "@/hooks/useLoaderHook";
import { useSelector } from "react-redux";
import { GenerateQrcodeOfCashpointApiCall } from "@/hooks/servies/chasPointApi";

/* ---------------- EXPIRY OPTIONS ---------------- */
const EXPIRY_OPTIONS = [
  { label: "5 min", value: "5" },
  { label: "10 min", value: "10" },
  { label: "15 min", value: "15" },
  { label: "20 min", value: "20" },
  { label: "25 min", value: "25" },
  { label: "30 min", value: "30" },
];

/* ---------------- ZOD SCHEMA ---------------- */
const cashpointSchema = z.object({
  txnAmount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid amount"),
  // payeeVPA: z
  //   .string()
  //   .min(1, "Payee VPA is required")
  //   .regex(/^[\w.\-]+@[\w]+$/, "Invalid VPA (e.g. name@bank)"),
  expiryTime: z.string().min(1, "Expiry time is required"),
  mobileNumber: z
    .string()
    .min(1, "Mobile number is required")
    .regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
  txnNote: z
    .string()
    .max(100, "Max 100 characters")
    .optional()
    .or(z.literal("")),
});

type CashpointForm = z.infer<typeof cashpointSchema>;

/* ---------------- REQUIRED LABEL COMPONENT ---------------- */
const RequiredLabel = ({
  text,
  color,
  optional,
}: {
  text: string;
  color: string;
  optional?: boolean;
}) => (
  <Text style={[styles.label, { color }]}>
    {text}
    {optional ? (
      <Text style={styles.optional}> (Optional) </Text>
    ) : (
      <Text style={styles.required}>*</Text>
    )}
  </Text>
);

export default function CashpointScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  // const router = useRouter();
  const company = useCompany();
  const { getLocation } = useSelector((state: any) => state.services);

  const lot_long =  getLocation?.latitude?.toString() + "," + getLocation?.longitude?.toString();
  

  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [payloadData, setPayloadData] = useState("");
  const [showExpiryDropdown, setShowExpiryDropdown] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CashpointForm>({
    resolver: zodResolver(cashpointSchema),
    defaultValues: {
      txnAmount: "",
      // payeeVPA: "",
      expiryTime: "",
      mobileNumber: "",
      txnNote: "",
    },
  });

  const onSubmit = async (datas: CashpointForm) => {
    setIsLoading(true);

    const getDeviceTypeString = (type: Device.DeviceType | null): string => {
      switch (type) {
        case Device.DeviceType.PHONE:
          return "PHONE";
        case Device.DeviceType.TABLET:
          return "TABLET";
        case Device.DeviceType.DESKTOP:
          return "DESKTOP";
        case Device.DeviceType.TV:
          return "TV";
        default:
          return "UNKNOWN";
      }
    };

    const getIpAddress = async (): Promise<string> => {
      try {
        const ip = await Network.getIpAddressAsync();
        return ip || "0.0.0.0";
      } catch {
        return "0.0.0.0";
      }
    };

    const ipAddress = await getIpAddress();
    try {
      const payload: any = {
        amount: datas.txnAmount,
        // payeeVPA: datas.payeeVPA,
        expiryTime: datas.expiryTime,
        txnNote: datas.txnNote,
        mobilenumber: datas.mobileNumber,
        deviceInfo: {
          deviceType: getDeviceTypeString(Device.deviceType),
          androidOsVersion: Device.osVersion ?? "unknown",
          deviceVersion: Device.osBuildId ?? "unknown",
          androidAgent: Platform.OS === "android" ? "Android" : Platform.OS,
          platformType: Platform.OS,
          deviceSerialNo: Device.modelName ?? "unknown",
          mobileNo: datas.mobileNumber,
          ip: ipAddress,
          packageName: Application.applicationId ?? "unknown",
          version: Application.nativeApplicationVersion ?? "1.0.0",
        },
        lat_long: lot_long,
      };
        // setQrValue(payload);
        // setShowQR(true);


      const res = await GenerateQrcodeOfCashpointApiCall(payload)
      // TODO: call your API, then use the response for QR
      if( res?.status === "INITIATED"){     
        setQrValue(res);
        setPayloadData(payload)
        setShowQR(true);
      }else{
        Alert.alert(res?.status , res?.message)
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const colors = {
    background: isDark ? "#021a22" : "#eaf3f6",
    header: isDark ? "#032834" : "#350083",
    card: isDark ? "#0f2b33" : "#ffffff",
    text: isDark ? "#ffffff" : "#000000",
    subText: isDark ? "#cbd5e1" : "#374151",
    inputBorder: isDark ? "#2f4f58" : "#d1d5db",
    inputBg: isDark ? "#0a2229" : "#f9fafb",
    button: isDark ? "#0b4a5a" : "#350083",
    error: "#ef4444",
    label: isDark ? "#94a3b8" : "#6b7280",
    dropdownBg: isDark ? "#0f2b33" : "#ffffff",
    dropdownBorder: isDark ? "#2f4f58" : "#e5e7eb",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <HeaderSection title="Cashpoint" />

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={company.logo}
            style={{ width: 100, height: 72, borderRadius: 16 }}
          />
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Payment Details
            </Text>
            <View
              style={[styles.cardDivider, { backgroundColor: colors.inputBorder }]}
            />
          </View>

          {/* Transaction Amount */}
          <View style={styles.fieldGroup}>
            <RequiredLabel text="Amount" color={colors.label} />
            <Controller
              control={control}
              name="txnAmount"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Enter transaction amount"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  editable={!isLoading}
                  style={[
                    styles.input,
                    {
                      borderColor: errors.txnAmount
                        ? colors.error
                        : colors.inputBorder,
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                    },
                  ]}
                />
              )}
            />
            {errors.txnAmount && (
              <Text style={[styles.error, { color: colors.error }]}>
                {errors.txnAmount.message}
              </Text>
            )}
          </View>


          {/* Payee VPA */}
          {/* <View style={styles.fieldGroup}>
            <RequiredLabel text="Payee VPA" color={colors.label} />
            <Controller
              control={control}
              name="payeeVPA"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="name@bank"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  editable={!isLoading}
                  style={[
                    styles.input,
                    {
                      borderColor: errors.payeeVPA
                        ? colors.error
                        : colors.inputBorder,
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                    },
                  ]}
                />
              )}
            />
            {errors.payeeVPA && (
              <Text style={[styles.error, { color: colors.error }]}>
                {errors.payeeVPA.message}
              </Text>
            )}
          </View> */}

          {/* Mobile Number */}
          <View style={styles.fieldGroup}>
            <RequiredLabel text="Mobile Number" color={colors.label} />
            <Controller
              control={control}
              name="mobileNumber"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={value}
                  onChangeText={onChange}
                  editable={!isLoading}
                  style={[
                    styles.input,
                    {
                      borderColor: errors.mobileNumber
                        ? colors.error
                        : colors.inputBorder,
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                    },
                  ]}
                />
              )}
            />
            {errors.mobileNumber && (
              <Text style={[styles.error, { color: colors.error }]}>
                {errors.mobileNumber.message}
              </Text>
            )}
          </View>

          {/* Expiry Time Dropdown */}
          <View style={styles.fieldGroup}>
            <RequiredLabel text="Expiry Time" color={colors.label} />
            <Controller
              control={control}
              name="expiryTime"
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => !isLoading && setShowExpiryDropdown(true)}
                    style={[
                      styles.input,
                      styles.dropdownTrigger,
                      {
                        borderColor: errors.expiryTime
                          ? colors.error
                          : colors.inputBorder,
                        backgroundColor: colors.inputBg,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: value ? colors.text : "#9ca3af",
                        fontSize: 15,
                      }}
                    >
                      {value
                        ? EXPIRY_OPTIONS.find((o) => o.value === value)?.label ||
                          value
                        : "Select expiry time"}
                    </Text>
                    <Text style={{ color: colors.label, fontSize: 12 }}>▼</Text>
                  </TouchableOpacity>

                  <Modal
                    visible={showExpiryDropdown}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowExpiryDropdown(false)}
                  >
                    <Pressable
                      style={styles.modalOverlay}
                      onPress={() => setShowExpiryDropdown(false)}
                    >
                      <View
                        style={[
                          styles.dropdownMenu,
                          {
                            backgroundColor: colors.dropdownBg,
                            borderColor: colors.dropdownBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.dropdownTitle, { color: colors.text }]}
                        >
                          Select Expiry Time
                        </Text>
                        <FlatList
                          data={EXPIRY_OPTIONS}
                          keyExtractor={(item) => item.value}
                          renderItem={({ item }) => {
                            const selected = item.value === value;
                            return (
                              <TouchableOpacity
                                style={[
                                  styles.dropdownItem,
                                  selected && {
                                    backgroundColor: isDark
                                      ? "#0b4a5a"
                                      : "#f3e8ff",
                                  },
                                ]}
                                onPress={() => {
                                  onChange(item.value);
                                  setShowExpiryDropdown(false);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.dropdownItemText,
                                    {
                                      color: colors.text,
                                      fontWeight: selected ? "700" : "500",
                                    },
                                  ]}
                                >
                                  {item.label}
                                </Text>
                                {selected && (
                                  <Text
                                    style={{
                                      color: colors.button,
                                      fontWeight: "700",
                                    }}
                                  >
                                    ✓
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          }}
                        />
                      </View>
                    </Pressable>
                  </Modal>
                </>
              )}
            />
            {errors.expiryTime && (
              <Text style={[styles.error, { color: colors.error }]}>
                {errors.expiryTime.message}
              </Text>
            )}
          </View>

          {/* Transaction Note */}
          <View style={styles.fieldGroup}>
            <RequiredLabel text="Transaction Note" color={colors.label} optional />
            <Controller
              control={control}
              name="txnNote"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Add a note for this transaction"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                  editable={!isLoading}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.input,
                    styles.multiline,
                    {
                      borderColor: errors.txnNote
                        ? colors.error
                        : colors.inputBorder,
                      color: colors.text,
                      backgroundColor: colors.inputBg,
                    },
                  ]}
                />
              )}
            />
            {errors.txnNote && (
              <Text style={[styles.error, { color: colors.error }]}>
                {errors.txnNote.message}
              </Text>
            )}
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.button },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
            <Text style={styles.buttonText}>SUBMIT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* QR Modal */}
      <QRCodeModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        title="Cashpoint QR"
        payloadData={payloadData}
        qrData={qrValue}
      />

      {/* Full screen overlay loader */}
      <FullScreenLoader loading={isLoading} />
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 340,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  card: {
    width: "92%",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 24,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cardDivider: {
    height: 1,
    marginTop: 12,
    opacity: 0.5,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  required: {
    color: "#ef4444",
    fontWeight: "700",
  },
  optional: {
    fontWeight: "400",
    fontStyle: "italic",
    textTransform: "none",
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  multiline: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  button: {
    width: "92%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  /* ---------------- DROPDOWN STYLES ---------------- */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  dropdownMenu: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
    maxHeight: 380,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingVertical: 12,
    letterSpacing: 0.3,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  dropdownItemText: {
    fontSize: 15,
  },
});