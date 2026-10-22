import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  useColorScheme,
  RefreshControl,
  Alert,
} from 'react-native';

import CustomDrawer from '@/components/navbar/drawer';
import Navbar from '@/components/navbar/navbar';
import BalanceCard from '@/components/home/balanceCard';
import RechargeCard from '@/components/home/rechargeCollectionCard';
import BankingServicesCard from '@/components/home/bankingService';
import FintechSlider from '@/components/slider/silider';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';

import { useRouter } from 'expo-router';
import { ContactDataApiCall, fetchBalance, getAllServices } from '@/hooks/servies/serviceApi';
import { setUser } from '@/redux/auth/authSlice';
import { getCustomer } from '@/hooks/customerApi/customerApi';
import { getAepsKycStatus } from '@/hooks/aepsApi/kycApi';
import { onLocation } from '@/hooks/use-location';
import News from '@/components/home/news';
import { useCompany } from '@/constants/string';
import { fetchRole } from '@/hooks/servies/use-role-fetch';

const Home = () => {
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const dispatch = useDispatch();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const company = useCompany();

  const { balance } = useSelector((state: any) => state.wallet);
  const userData = useSelector((state:any) => state.auth.user);
  const userRoleId = userData?.data?.accountkycstatus?.role;


  const router = useRouter();

  // --- KYC & Redirection Logic ---
  const handleKycRedirection = useCallback((user: any) => {
    const kycStatus = user?.data?.accountkycstatus?.kyc;
    const hasBalance = balance !== null && balance !== undefined;

    if (kycStatus === 'PENDING') {
      router.replace('/(tabs)');
    } else if (kycStatus === 'YES') {
      router.replace('/(tabs)');
    } else if (kycStatus === 'NO') {
      router.replace('/(auth)/doKyc');
    } else if (!hasBalance) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(auth)/intialPage');
    }
  }, [balance, router]);

  // --- Main data loading ---
  const loadData = useCallback(async () => {
    try {
      const userString = await AsyncStorage.getItem('user');
  //  console.log(userString);
   
      const user = JSON.parse(userString as any);
      // console.log(user);

      
      if (!user?.data) {
        router.replace('/(auth)/intialPage');
        return;
      }

      dispatch(setUser(user));
      setRefreshing(true);

      await Promise.all([
        fetchBalance(dispatch),
        getAllServices(dispatch),
        getCustomer(dispatch),
        getAepsKycStatus(dispatch),
        onLocation(dispatch),
        ContactDataApiCall(dispatch),
        fetchRole(dispatch, userRoleId)
      ]);

      handleKycRedirection(user);
    } catch {
       Alert.alert('Error', 'Failed to load data.');
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, router, handleKycRedirection,userRoleId]);

  // --- Initial load & refresh ---
  useEffect(() => {
    if (isFirstLoad) {
      loadData();
      setIsFirstLoad(false);
    }
  }, [isFirstLoad, loadData,dispatch,userRoleId]);

  const onRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // --- Render ---
  return (
    <LinearGradient
      colors={
        colorScheme === 'light'
          ? ['#ebe6e6', '#dfdddd', '#fff']
          : ['#02232f', '#01090d', '#022733', '#000000']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Navbar open={open} setOpen={setOpen} title={company.name} />
      <CustomDrawer visible={open} onClose={() => setOpen(false)} />

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colorScheme === 'light' ? '#000' : '#fff'}
          />
        }
      >
        <BalanceCard />
        <News />
        <FintechSlider />
        <BankingServicesCard />
        <RechargeCard />
      </ScrollView>
    </LinearGradient>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 160,
  },
});