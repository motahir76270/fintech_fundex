import RechargeReportModal from "@/components/modal/recharge/RechargeReportModal";
import PlanModal from "@/components/modal/ViewPlan";
import HeaderSection from "@/components/navbar/header";
import { useCompany } from "@/constants/string";
import { useRechargeApi } from "@/hooks/servies/rechargeApi";
import {
    setError,
    setFetchOpreator,
    setFetchPlan,
    setLoading,
    setPlan,
    setShowOperators,
} from "@/redux/recharge/rechargeSlice";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";

/* -------------------- Validation -------------------- */
const rechargeSchema = z.object({
  mobile: z
    .string()
    .min(10, "Mobile number must be 10 digits")
    .max(10, "Mobile number must be 10 digits"),
  operator: z.string().min(1, "Please select an operator"),
  amount: z
    .string()
    .refine((val) => Number(val) > 0, "Amount must be greater than 0"),
});

export default function RechargeScreen() {
  const company = useCompany();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const dispatch = useDispatch();
  const { getAllOperatorsApi, fetchOperatorByMobile, PayRechargeNow } =
    useRechargeApi();

  // Redux state
  const {
    getAllOperator,
    fetchOperator,
    plan: reduxSelectedPlan,
    loading,
  } = useSelector((state: any) => state.recharge);

  // Parse fetchOperator if it's a string
  const fetchOperatorData = useMemo(() => {
    try {
      if (fetchOperator && typeof fetchOperator === "string") {
        return JSON.parse(fetchOperator);
      }
      return fetchOperator || {};
    } catch (e) {
      console.error("Error parsing fetchOperator:", e);
      return {};
    }
  }, [fetchOperator]);

  const [isPlansModalVisible, setIsPlansModalVisible] = useState(false);
  const [visibleReportModal, setVisibleReportModal] = useState(false);
  const [showReport, setShowReport] = useState<any>(null);
  const [isOperatorDropdownVisible, setIsOperatorDropdownVisible] =
    useState(false);
  const [localSelectedPlan, setLocalSelectedPlan] = useState<any>(null);
  const [selectOperatorDrop, setSelectOperatorDrop] = useState("");

  // Use either redux plan or local plan
  const selectedPlan = reduxSelectedPlan || localSelectedPlan;

  const colors = {
    background: isDark ? "#021a22" : "#eaf3f6",
    header: isDark ? "#032834" : "#2a0888",
    card: isDark ? "#0f2b33" : "#ffffff",
    text: isDark ? "#ffffff" : "#000000",
    border: isDark ? "#2f4f58" : "#ccc",
    button: isDark ? "#0b4a5a" : "#350083",
    placeholder: "#9ca3af",
    operatorItem: isDark ? "#1a3a45" : "#f0f0f0",
    planCard: isDark ? "#1a3a45" : "#f8f9fa",
    planBorder: isDark ? "#2f4f58" : "#e0e0e0",
    overlay: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
  };

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(rechargeSchema),
    defaultValues: {
      mobile: "",
      operator: "",
      amount: "",
    },
  });

  // Watch mobile field for changes
  const mobileValue = useWatch({
    control,
    name: "mobile",
    defaultValue: "",
  });

  // Set operator value when fetchOperatorData changes
  useEffect(() => {
    if (fetchOperatorData?.operator) {
      setValue("operator", fetchOperatorData.operator);
    } else {
      setValue("operator", "");
      setValue("amount", "");
    }
  }, [fetchOperatorData, setValue]);

  // Set amount when selectedPlan changes
  useEffect(() => {
    if (selectedPlan?.price) {
      setValue("amount", selectedPlan.price.toString());
    }
  }, [selectedPlan, setValue]);

  // Fetch operator when mobile number is 10 digits
  useEffect(() => {
    const fetchOperatorForMobile = async () => {
      if (mobileValue && mobileValue.length === 10) {
        dispatch(setError(null));
        await fetchOperatorByMobile(mobileValue, setValue);
      } else {
        dispatch(setFetchOpreator(""));
        dispatch(setFetchPlan(""));
        handleClearPlan();
      }
    };

    fetchOperatorForMobile();
  }, [mobileValue, dispatch, fetchOperatorByMobile, setValue]);

  const handleGetAllOperatorsApi = async () => {
    dispatch(setLoading(true));
    setIsOperatorDropdownVisible(true);
    await getAllOperatorsApi();
  };

  const handleOperatorSelect = (operator: any) => {
    setValue("operator", operator.name);
    setSelectOperatorDrop(operator.code);
    setIsOperatorDropdownVisible(false);
    dispatch(setShowOperators(false));
  };

  const handleFetchPlans = async () => {
    dispatch(setError(null));
    setIsPlansModalVisible(true);
    dispatch(setLoading(false));
  };

  const onSubmit = async (data: any) => {
    const payload = {
      mobile: data.mobile,
      operator: fetchOperatorData.id
        ? fetchOperatorData?.id
        : selectOperatorDrop,
      amount: selectedPlan?.price || data?.amount,
    };

   const res = await PayRechargeNow(payload);
   if(res.status === "SUCCESS"){
     setShowReport(res);
     setVisibleReportModal(true);
     reset();
     dispatch(setPlan(null));
     setLocalSelectedPlan(null);
   }
  };

  const handleClearPlan = () => {
    setLocalSelectedPlan(null);
    dispatch(setPlan(null));
    setValue("amount", "");
  };

  // Close operator dropdown when clicking outside
  const closeOperatorDropdown = () => {
    setIsOperatorDropdownVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Full-screen loader */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={loading}
        onRequestClose={() => {}}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <View
            style={[styles.loaderContainer, { backgroundColor: colors.card }]}
          >
            <ActivityIndicator size="large" color={colors.button} />
            <Text style={[styles.loaderText, { color: colors.text }]}>
              Processing...
            </Text>
            <Text style={[styles.loaderSubText, { color: colors.placeholder }]}>
              Please wait while we process your request
            </Text>
          </View>
        </View>
      </Modal>

      {/* Plans Modal */}
      <PlanModal
        visible={isPlansModalVisible}
        onClose={() => setIsPlansModalVisible(false)}
        colors={{
          card: colors.card,
          text: colors.text,
          border: colors.border,
          placeholder: colors.placeholder,
          button: colors.button,
          overlay: colors.overlay,
          planCard: colors.planCard,
          planBorder: colors.planBorder,
        }}
      />

      {/* Header */}
        <HeaderSection title="Mobile Recharge" />


      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={company.logo}
          style={{ width: 112, height: 92, borderRadius: 18 }}
        />
      </View>

      {/* Replace ScrollView with View and use FlatList for better performance */}
      <FlatList
        data={[{ key: "content" }]}
        renderItem={() => (
          <View>
            {/* Card */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Recharge
              </Text>

              {/* Mobile */}
              <Controller
                control={control}
                name="mobile"
                render={({ field: { onChange, value } }) => (
                  <>
                    <TextInput
                      style={[
                        styles.input,
                        { borderColor: colors.border, color: colors.text },
                        loading && styles.disabledInput,
                      ]}
                      placeholder="Mobile Number"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={onChange}
                      maxLength={10}
                      editable={!loading}
                    />
                    {errors.mobile && (
                      <Text style={styles.error}>{errors.mobile.message}</Text>
                    )}
                  </>
                )}
              />

              {/* Operator */}
              <Controller
                control={control}
                name="operator"
                render={({ field: { value } }) => (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.dropdown,
                        { borderColor: colors.border },
                        loading && styles.disabledInput,
                      ]}
                      onPress={handleGetAllOperatorsApi}
                      disabled={loading}
                    >
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator
                            size="small"
                            color={colors.button}
                          />
                          <Text
                            style={[
                              styles.dropdownText,
                              { color: colors.placeholder, marginLeft: 8 },
                            ]}
                          >
                            Loading...
                          </Text>
                        </View>
                      ) : (
                        <>
                          <Text
                            style={[
                              styles.dropdownText,
                              {
                                color: value ? colors.text : colors.placeholder,
                              },
                            ]}
                          >
                            {fetchOperatorData?.operator
                              ? fetchOperatorData.operator
                              : value || "Select operator"}
                          </Text>
                          <Ionicons
                            name="chevron-down"
                            size={20}
                            color={colors.text}
                          />
                        </>
                      )}
                    </TouchableOpacity>

                    {errors.operator &&
                      !isOperatorDropdownVisible &&
                      !loading && (
                        <Text style={styles.error}>
                          {errors.operator.message}
                        </Text>
                      )}
                  </>
                )}
              />

              {/* Amount with Plan Button */}
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                  <>
                    <View style={styles.amountContainer}>
                      <View
                        style={[
                          styles.amountInput,
                          { borderColor: colors.border, flex: 2 },
                          loading && styles.disabledInput,
                        ]}
                      >
                        <Text style={[styles.rupee, { color: colors.text }]}>
                          ₹
                        </Text>
                        <TextInput
                          style={[
                            styles.amountTextInput,
                            { color: colors.text },
                          ]}
                          placeholder="Amount"
                          placeholderTextColor={colors.placeholder}
                          keyboardType="number-pad"
                          value={value}
                          onChangeText={onChange}
                          editable={fetchOperatorData.id ? false : true}
                        />
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.planButton,
                          {
                            backgroundColor: !fetchOperatorData?.operator
                              ? "#766c88"
                              : colors.button,
                          },
                        ]}
                        onPress={handleFetchPlans}
                        disabled={loading || !fetchOperatorData?.operator}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.planButtonText}>Plans</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    {errors.amount && (
                      <Text style={styles.error}>{errors.amount.message}</Text>
                    )}
                  </>
                )}
              />

              {/* Selected Plan Info */}
              {selectedPlan && selectedPlan?.price && fetchOperator && (
                <View
                  style={[
                    styles.selectedPlanInfo,
                    { borderColor: colors.button },
                  ]}
                >
                  <Text
                    style={[styles.selectedPlanText, { color: colors.text }]}
                  >
                    Selected Plan: ₹{selectedPlan.price} -{" "}
                    {selectedPlan.validity || ""}
                  </Text>
                  <TouchableOpacity onPress={handleClearPlan}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.placeholder}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Pay Button */}
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: colors.button }]}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.payText}>PAY NOW</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={() => "content"}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.flatListContent}
      />

      {/* Operator Dropdown Modal - Separate modal to avoid nesting FlatList inside ScrollView */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isOperatorDropdownVisible && getAllOperator?.length > 0}
        onRequestClose={closeOperatorDropdown}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={closeOperatorDropdown}
        >
          <View style={styles.dropdownModalContainer}>
            <View
              style={[
                styles.operatorListModal,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.dropdownHeader}>
                <Text
                  style={[styles.dropdownHeaderText, { color: colors.text }]}
                >
                  Select Operator
                </Text>
                <TouchableOpacity onPress={closeOperatorDropdown}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={getAllOperator}
                keyExtractor={(item, index) =>
                  item.id?.toString() || index.toString()
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.operatorItemModal,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => handleOperatorSelect(item)}
                  >
                    <Text
                      style={[styles.operatorItemText, { color: colors.text }]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={
                  <View style={{ padding: 20, alignItems: "center" }}>
                    <Text style={{ color: colors.placeholder }}>
                      No operators found
                    </Text>
                  </View>
                }
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

          {/* Recharge Report Modal */}
    <RechargeReportModal
      visible={visibleReportModal}
      onClose={() => {
        setVisibleReportModal(false);
        setShowReport(null);
        reset();
        dispatch(setPlan(null));
        setLocalSelectedPlan(null);
      }}
      transactionData={showReport}
    />
    </View>
  );
}

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    paddingBottom: -15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 16,
    fontWeight: "600",
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  logoText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  disabledInput: {
    opacity: 0.6,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rupee: {
    fontSize: 18,
    marginRight: 6,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 16,
  },
  planButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  planButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedPlanInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  selectedPlanText: {
    fontSize: 14,
    flex: 1,
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },
  payButton: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  payText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  loaderSubText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  dropdownModalContainer: {
    width: "90%",
    maxHeight: "70%",
    justifyContent: "center",
    margin: 20,
  },
  operatorListModal: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: 400,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  dropdownHeaderText: {
    fontSize: 18,
    fontWeight: "600",
  },
  operatorItemModal: {
    padding: 14,
    borderBottomWidth: 1,
  },
  operatorItemText: {
    fontSize: 16,
  },
});
