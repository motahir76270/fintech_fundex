import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useColorScheme } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUser } from '@/redux/auth/authSlice';
import { useRouter } from 'expo-router';
import HeaderSection from '@/components/navbar/header';

const PendingKyc = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const colorScheme = useColorScheme();

  // Theme colors
  const colors = colorScheme === 'light' 
    ? {
        background: '#fff',
        headerBg: '#350083',
        text: '#111827',
        subText: '#6B7280',
        iconBg: '#FEF3C7',
        badgeBg: '#FEF3C7',
        badgeText: '#92400E',
        buttonBg: '#111827',
        buttonText: '#fff',
        statusBar: 'dark',
      }
    : {
        background: '#01090d',
        headerBg: '#084357',
        text: '#ffffff',
        subText: '#b0bec5',
        iconBg: '#1a2a3a',
        badgeBg: '#1a2a3a',
        badgeText: '#F59E0B',
        buttonBg: '#4fc3f7',
        buttonText: '#01090d',
        statusBar: 'light',
      };

  const handleBackBTN = async () => {
    await AsyncStorage.removeItem('user');
    dispatch(setUser(''));
    Alert.alert("Thank you for visiting our app", "please wait for the KYC verification");
    router.replace('/(auth)/login');
  };


  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header Section */}
          <HeaderSection title="KYC Status" />

        {/* Main Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
            <Ionicons name="time-outline" size={80} color="#F59E0B" />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            KYC Verification Pending
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.subText }]}>
            Your KYC documents are currently under review.
            This process usually takes 24–48 hours.
            You will be notified once verification is complete.
          </Text>

          {/* Status Badge */}
          <View style={[styles.badge, { backgroundColor: colors.badgeBg }]}>
            <MaterialIcons name="hourglass-empty" size={18} color="#F59E0B" />
            <Text style={[styles.badgeText, { color: colors.badgeText }]}>
              Under Review
            </Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.buttonBg }]} 
            onPress={handleBackBTN}
          >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>
              Go Back
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </>
  );
};

export default PendingKyc;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    zIndex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    padding: 25,
    borderRadius: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 30,
  },
  badgeText: {
    marginLeft: 6,
    fontWeight: '600',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});