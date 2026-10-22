import { setPlan } from "@/redux/recharge/rechargeSlice";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

interface PlanModalProps {
  visible: boolean;
  onClose: () => void;
  colors: {
    card: string;
    text: string;
    border: string;
    placeholder: string;
    button: string;
    overlay: string;
    planCard: string;
    planBorder: string;
  };
}

interface PlanItem {
  desc?: string;
  price?: string;
  rs?: string;
  validity?: string;
  [key: string]: any;
}

interface CategoryData {
  catArray: PlanItem[];
  catName: string;
}

const PlanModal: React.FC<PlanModalProps> = ({ visible, onClose, colors }) => {
  const [selectedTab, setSelectedTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { fetchPlan } = useSelector((state: any) => state.recharge);
  const dispatch = useDispatch();

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedTab("All");
      setSearchQuery("");
      setShowSearch(false);
    }
  }, [visible]);

  // Process the fetchPlan array into categories and plans
  const categoriesData = useMemo(() => {
    if (!fetchPlan || !Array.isArray(fetchPlan)) {
      return { categories: [], plansMap: {} };
    }

    const categories: string[] = [];
    const plansMap: { [key: string]: PlanItem[] } = {};

    fetchPlan.forEach((category: CategoryData) => {
      if (category.catName && Array.isArray(category.catArray)) {
        categories.push(category.catName);
        plansMap[category.catName] = category.catArray;
      }
    });

    return { categories, plansMap };
  }, [fetchPlan]);

  // Get all categories including "All"
  const categories = useMemo(() => {
    return ["All", ...categoriesData.categories.sort()];
  }, [categoriesData.categories]);

  // Get all plans combined for "All" tab
  const allPlans = useMemo(() => {
    if (!categoriesData.plansMap) return [];
    return Object.values(categoriesData.plansMap).flat();
  }, [categoriesData.plansMap]);

  // Get plans based on selected tab
  const tabBasedPlans = useMemo(() => {
    if (selectedTab === "All") {
      return allPlans;
    } else {
      return categoriesData.plansMap[selectedTab] || [];
    }
  }, [selectedTab, allPlans, categoriesData.plansMap]);

  // Apply search filter
  const filteredPlans = useMemo(() => {
    if (!searchQuery.trim()) {
      return tabBasedPlans;
    }

    const query = searchQuery.toLowerCase().trim();
    return tabBasedPlans.filter((plan: PlanItem) => {
      // Search in price/rs
      if (plan.price?.toString().includes(query)) return true;
      if (plan.rs?.toString().includes(query)) return true;

      // Search in description
      if (plan.desc?.toLowerCase().includes(query)) return true;

      // Search in validity
      if (plan.validity?.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [tabBasedPlans, searchQuery]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    Object.keys(categoriesData.plansMap).forEach((key) => {
      counts[key] = categoriesData.plansMap[key]?.length || 0;
    });
    return counts;
  }, [categoriesData.plansMap]);

  const handlePlanSelect = (item: PlanItem) => {
    
    dispatch(setPlan(item));
    onClose();
  };

  const renderPlanItem = ({ item }: { item: PlanItem }) => (
    <TouchableOpacity
      style={[
        styles.planItem,
        { backgroundColor: colors.planCard, borderColor: colors.planBorder },
      ]}
      onPress={() => handlePlanSelect(item)}
    >
      <View style={styles.planItemHeader}>
        <Text style={[styles.planAmount, { color: colors.text }]}>
          ₹{item.price || item.rs}
        </Text>
        <View style={styles.planBadge}>
          <Text style={[styles.planValidity, { color: colors.button }]}>
            {item.validity}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.planDescription, { color: colors.placeholder }]}
        numberOfLines={3}
      >
        {item.desc || "No description available"}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoryTab = (category: string) => {
    const count =
      category !== "All" ? categoryCounts[category] || 0 : allPlans.length;

    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.tab,
          selectedTab === category && styles.selectedTab,
          {
            borderColor: colors.border,
            backgroundColor:
              selectedTab === category ? colors.button : "transparent",
          },
        ]}
        onPress={() => setSelectedTab(category)}
      >
        <Text
          style={[
            styles.tabText,
            { color: selectedTab === category ? "#fff" : colors.text },
          ]}
        >
          {category} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[styles.plansModalContainer, { backgroundColor: colors.card }]}
        >
          {/* Header with search */}
          <View
            style={[
              styles.plansModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            {showSearch ? (
              <View
                style={[styles.searchContainer, { borderColor: colors.border }]}
              >
                <Ionicons name="search" size={20} color={colors.placeholder} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search plans..."
                  placeholderTextColor={colors.placeholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setShowSearch(false);
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.placeholder} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.plansModalTitle, { color: colors.text }]}>
                  Recharge Plans
                </Text>
                <View style={styles.headerButtons}>
                  <TouchableOpacity
                    onPress={() => setShowSearch(true)}
                    style={styles.headerButton}
                  >
                    <Ionicons name="search" size={22} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Category Tabs */}
          {categories.length > 1 && !showSearch && (
            <View
              style={[
                styles.tabsContainer,
                { borderBottomColor: colors.border },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsScrollContent}
              >
                {categories.map(renderCategoryTab)}
              </ScrollView>
            </View>
          )}

          {/* Results count */}
          {searchQuery ? (
            <View
              style={[
                styles.searchResults,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.searchResultsText,
                  { color: colors.placeholder },
                ]}
              >
                Found {filteredPlans.length} plans for {searchQuery}
              </Text>
            </View>
          ) : (
            selectedTab !== "All" && (
              <View
                style={[
                  styles.categoryHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.categoryTitle, { color: colors.text }]}>
                  {selectedTab} Plans
                </Text>
                <Text
                  style={[styles.categoryCount, { color: colors.placeholder }]}
                >
                  {filteredPlans.length} available
                </Text>
              </View>
            )
          )}

          <FlatList
            data={filteredPlans}
            keyExtractor={(item, index) => `${selectedTab}-${index}-${item.price || item.rs}`}
            renderItem={renderPlanItem}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.plansModalList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color={colors.placeholder}
                />
                <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                  {searchQuery
                    ? `No plans found for "${searchQuery}"`
                    : "No plans available in this category"}
                </Text>
                {searchQuery && (
                  <TouchableOpacity
                    style={[
                      styles.clearSearchButton,
                      { borderColor: colors.button },
                    ]}
                    onPress={() => {
                      setSearchQuery("");
                      setShowSearch(false);
                    }}
                  >
                    <Text
                      style={[styles.clearSearchText, { color: colors.button }]}
                    >
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  plansModalContainer: {
    width: "99%",
    height: "90%",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    position:"absolute",
    bottom:0
  },
  plansModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  plansModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    padding: 0,
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabsScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  selectedTab: {
    borderWidth: 0,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchResults: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchResultsText: {
    fontSize: 14,
    fontWeight: "500",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryCount: {
    fontSize: 14,
  },
  plansModalList: {
    padding: 16,
    paddingBottom: 130,
  },
  planItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  planAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  planBadge: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planValidity: {
    fontSize: 14,
    fontWeight: "600",
  },
  planDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  clearSearchButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 20,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default PlanModal;