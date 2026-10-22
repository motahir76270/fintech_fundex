import { View, Text, Alert, TouchableOpacity, StyleSheet, FlatList, TextInput, Platform, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getAllMemeber } from '@/hooks/servies/addMemberApi'
import { setMember } from '@/redux/customer/cutomerSlice'
import { LinearGradient } from "expo-linear-gradient";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AddMemberModal from '@/components/modal/addMemberModal'
import HeaderSection from '@/components/navbar/header'
import { FullScreenLoader } from '@/hooks/useLoaderHook'

interface MemberType {
  id: number;
  email: string;
  first: string;
  last: string;
  mobile: string;
  role_name: string;
  ref_by: string;
  created_at: string | null;
  updated_at: string | null;
  ip: string;
  role: string;
}

const Member = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMembers, setFilteredMembers] = useState<MemberType[]>([]);
  
  // Get members from Redux store
  const members = useSelector((state: any) => state.customer?.allMember || []);

  const fetchMember = async (isRefresh = false) => {
    try {
      // Only show full screen loader on initial load, not on pull-to-refresh
      if (!isRefresh) setLoading(true);

      const res = await getAllMemeber();
      
      if (res?.status === "SUCCESS") {
        const memberData = res?.data?.member || [];
        dispatch(setMember(memberData));
        setFilteredMembers(memberData);
      } else {
        Alert.alert(res?.status || "Error", res?.message || "Something went wrong");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to fetch members");
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchMember();
  }, [dispatch]);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMember(true);
  };

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = members.filter((member: MemberType) =>
        member.first?.toLowerCase().includes(query) ||
        member.last?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.mobile?.includes(searchQuery) ||
        member.role_name?.toLowerCase().includes(query)
      );
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  const handleMemberAdded = () => {
    fetchMember();
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  const getRandomColor = (id: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7D794'];
    return colors[id % colors.length];
  };

  const renderMemberItem = ({ item }: { item: MemberType }) => (
    <TouchableOpacity style={styles.memberCard}>
      <View style={[styles.avatarContainer, { backgroundColor: getRandomColor(item.id) }]}>
        <Text style={styles.avatarText}>{getInitials(item.first)}</Text>
      </View>
      
      <View style={styles.memberInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {item.first} {item.last}
          </Text>
          <View style={[
            styles.roleBadge, 
            { backgroundColor: item.role_name === 'Distributor' ? '#E8F5E9' : '#FFF3E0' }
          ]}>
            <Text style={[
              styles.roleText, 
              { color: item.role_name === 'Distributor' ? '#2E7D32' : '#E65100' }
            ]}>
              {item.role_name}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <FontAwesome5 name="envelope" size={12} color="#666" />
          <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <FontAwesome5 name="phone" size={12} color="#666" />
          <Text style={styles.detailText}>{item.mobile}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <FontAwesome5 name="user-friends" size={12} color="#666" />
          <Text style={styles.detailText}>Ref By: {item.ref_by || 'N/A'}</Text>
        </View>
      </View>
      
      <FontAwesome5 name="chevron-right" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="users" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>No Members Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? "Try a different search term" : "Click the + button to add your first member"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <HeaderSection title="Members" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FontAwesome5 name="search" size={16} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, phone or role..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <FontAwesome5 name="times-circle" size={16} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Member Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          Total Members: {filteredMembers.length}
        </Text>
      </View>

      {/* Member List with Pull-to-Refresh */}
      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMemberItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={EmptyListComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4F1CA9", "#350083"]}
            tintColor="#4F1CA9"
            title="Refreshing..."
            titleColor="#4F1CA9"
          />
        }
      />

      {/* Floating Action Button for Add Member */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#4F1CA9", "#350083"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <FontAwesome5 name="plus" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Member Modal */}
      <AddMemberModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        onMemberAdded={handleMemberAdded}
      />
      <FullScreenLoader loading={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    paddingVertical: 20
  },
  headerLeft: {
    padding: 8,
    width: 40,
  },
  headerRight: {
    padding: 8,
    width: 40,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 15,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
  },
  countContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  listContainer: {
    padding: 15,
    paddingTop: 5,
    paddingBottom: 80,
    flexGrow: 1, // ✅ Ensures pull-to-refresh works even when list is empty
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
    flexShrink: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
    flexShrink: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 15,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 50,
    width: 60,
    height: 60,
    borderRadius: 48,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Member;