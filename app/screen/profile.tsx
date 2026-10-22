import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
// import axios from "axios";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { getCustomer } from "@/hooks/customerApi/customerApi";
import { Image } from 'expo-image';
// import Constants from 'expo-constants';
import ProfileEditModal from "@/components/modal/editProfile";
import HeaderSection from "@/components/navbar/header";

export default function ProfileScreen() {
  // const baseURL = Constants.expoConfig?.extra?.API_URL;
  const [modalVisible, setModalVisible] = useState(false);

  const colorScheme = useColorScheme();
  const dispatch = useDispatch();
  const isDark = colorScheme === "dark";
  const profileData = useSelector((state: any) => state.customer.list);
  const userdata = useSelector((state:any) => state.auth.user)
  //  console.log(profileData);
   
  
  
  // Extract data from profileData with safe access
  const profile = profileData?.data?.profile || {};
  const kyc = userdata?.data?.accountkycstatus || {};
  const packageInfo = profileData?.data?.package || {};
  


  
  // Format address
  const address = kyc.district 
    ? `${kyc.address}${kyc.district ? `, ${kyc.district}` : ''}${kyc.state ? `, ${kyc.state}` : ''}${kyc.pincode ? ` - ${kyc.pincode}` : ''}`
    : 'Not Provided';

  const colors = {
    background: isDark ? "#0a1929" : "#f8fafc",
    header: isDark ? "#132f4c" : "#4f46e5",
    card: isDark ? "#1e293b" : "#ffffff",
    text: isDark ? "#f1f5f9" : "#1e293b",
    subText: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#334155" : "#e2e8f0",
    button: isDark ? "#3b82f6" : "#4f46e5",
    accent: isDark ? "#60a5fa" : "#6366f1",
    avatarBg: isDark ? "#3730a3" : "#4f46e5",
  };

  useEffect(() => {
    getCustomer(dispatch);
  }, [dispatch]);

  const handleEditPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(true);
  };


  const handleSaveProfile = (updatedData: any) => {
    // Refresh customer data after successful update
    getCustomer(dispatch);
    Alert.alert('Success', 'Profile updated successfully');
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Enhanced Header with Gradient Effect */}
        <HeaderSection title="Profile" />
    

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card with Shadow and Depth */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Avatar with Gradient Border */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarBorder, { borderColor: colors.accent }]}>
              <View
                style={[styles.avatar, { backgroundColor: colors.avatarBg }]}
              >
                {profileData ? (
                  <Image 
                    source={{ uri: profile?.profile }} 
                    style={styles.avatarImage} 
                  />
                ) : (
                  <FontAwesome5 name="user" size={32} color="#fff" />
                )}
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.cameraButton, { backgroundColor: colors.button }]}
              onPress={handleEditPress}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.infoSection}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {profile?.name}
            </Text>
            <Text style={[styles.userEmail, { color: colors.subText }]}>
              {packageInfo.MD || 'User'}
            </Text>
            {profile.username && (
              <View style={styles.usernameBadge}>
                <Text style={styles.usernameText}>@{profile.username}</Text>
              </View>
            )}
          </View>

          {/* Profile Details */}
          <View style={styles.detailsSection}>
            <ProfileRow
              icon="person-outline"
              label="Full Name"
              value={profile?.name}
              colors={colors}
            />
            <ProfileRow
              icon="phone-portrait-outline"
              label="Mobile Number"
              value={profile?.mobile}
              colors={colors}
              verified={!!profile.mobile}
            />
            <ProfileRow
              icon="mail-outline"
              label="Email Address"
              value={profile.email || 'Not Provided'}
              colors={colors}
              verified={!!profile.email}
            />
        
            <ProfileRow
              icon="location-outline"
              label="Address"
              value={address}
              colors={colors}
              verified={!!kyc.address}
              action={!kyc.address ? 'Add' : undefined}
            />
            <ProfileRow
              icon="business-outline"
              label="Shop Name"
              value={kyc.shopname || 'Not Provided'}
              colors={colors}
            />
            <ProfileRow
              icon="calendar-outline"
              label="Date of Birth"
              value={kyc.dob || 'Not Provided'}
              colors={colors}
            />
          </View>
        </View>

        {/* Enhanced Edit Button */}
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.button }]}
          onPress={handleEditPress}
          activeOpacity={0.8}
        >
          <MaterialIcons name="edit" size={22} color="#fff" />
          <Text style={styles.editButtonText}>EDIT PROFILE</Text>
        </TouchableOpacity>
      </ScrollView>

      <ProfileEditModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        profileData={profileData}
        colors={colors}
        onSave={handleSaveProfile}
      />
    </View>
  );
}

/* Enhanced Profile Row Component */
const ProfileRow = ({ icon, label, value, colors, verified, action }: any) => (
  <View style={[styles.row, { borderColor: colors.border }]}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowLabel, { color: colors.subText }]}>
          {label}
        </Text>
        <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
    <View style={styles.rowRight}>
      {verified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      )}
      {action && !verified && (
        <TouchableOpacity style={styles.actionButton}>
          <Text style={[styles.actionText, { color: colors.button }]}>
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 40,
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: -20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 20,
    marginTop: 20,
    padding: 20,
    paddingTop: 70,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarContainer: {
    alignItems: "center",
    position: "absolute",
    top: -50,
    alignSelf: "center",
  },
  avatarBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  infoSection: {
    alignItems: "center",
    marginBottom: 25,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  usernameBadge: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 4,
  },
  usernameText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
  },
  detailsSection: {
    gap: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  rowRight: {
    marginLeft: 10,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "600",
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  editButton: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 25,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 10,
    letterSpacing: 0.5,
  },
});