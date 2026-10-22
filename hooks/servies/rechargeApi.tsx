import { useCallback } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
import { useDispatch } from 'react-redux';
import {
  setFetchOpreator,
  setGetAllOperator,
  setFetchPlan,
  setLoading,
  setError,
  setShowOperators,
} from '@/redux/recharge/rechargeSlice';
import { Alert } from 'react-native';

const baseURL = Constants.expoConfig?.extra?.API_URL;

export const useRechargeApi = () => {
  const dispatch = useDispatch();

  // Get API headers from AsyncStorage
  const getApiHeaders = useCallback(async () => {
    try {
      const datas = await AsyncStorage.getItem("user");
      if (!datas) {
        throw new Error("No API keys found");
      }
      const keyData = JSON.parse(datas);
      return {
       "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
      };
    } catch {
      throw new Error("Failed to get API credentials");
    }
  }, []);

  // Get all operators
  const getAllOperatorsApi = useCallback(async () => {
    dispatch(setLoading(true));
    dispatch(setError(""));
    

      const headers = await getApiHeaders();
      const res = await fetch(`${baseURL}/api/recharge/get-operator/mobile`,  
        { method:"GET",
          headers
         });
         const response = await res.json();
       
      if (response?.status === "SUCCESS") {
        dispatch(setGetAllOperator(response.data.operatorList));
        dispatch(setShowOperators(true));
        dispatch(setLoading(false));
        return response.data.operatorList;
      } else {
        Alert.alert(`${response?.status}` , `${response?.message}`)
      }
    
  }, [dispatch, getApiHeaders]);

  // Fetch operator by mobile number
  const fetchOperatorByMobile = useCallback(async (mobileNumber: any, setValue?: any) => {
    dispatch(setLoading(true));
    dispatch(setError(""));
    
    try {
      const headers = await getApiHeaders(); 
      const payload = {
         mobile: mobileNumber, reqfrom: "api"
      }
      const response = await fetch(
        `${baseURL}/api/recharge/fetch-operator`,{ 
          method:"POST",
          body:JSON.stringify(payload),
          headers: {
            ...headers,
            "Content-Type": "application/json",
          }
        }
      );
      const data = await response.json();
      const plansData = data?.data?.allPlans;

      // console.log(plansData[0]);
      
      
      if(data?.status === "SUCCESS"){
        dispatch(setFetchOpreator(data));
        dispatch(setFetchPlan(plansData));
      }else{ 
        Alert.alert(`${data?.status}`, `${data?.message}`);
      }
    } catch {
      Alert.alert("ERROR", "Something went wrong while fetching operator information");
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, getApiHeaders]);


   const PayRechargeNow = useCallback(async (payload: any) => {
    dispatch(setLoading(true));
    dispatch(setError(""));
     
    const headers = await getApiHeaders();

    try {  
      const response = await fetch(
        `${baseURL}/api/recharge/do-recharge` ,{
           method:"POST",
           body:JSON.stringify(payload),
           headers:{
              ...headers,
              "Content-Type":"application/json"
           } }
      );        
       
      const data = await response.json();
      
      if (data?.status === "SUCCESS" ) {
        // Check if the response contains FULLTT or plans
        // Alert.alert(`${data?.status}`,`${data?.message}`)
        dispatch(setGetAllOperator(''))
        dispatch(setFetchOpreator(''))
        dispatch(setFetchPlan(''))
        dispatch(setLoading(false));
        return data;
      } else {
        Alert.alert(`${data?.status}`,`${data?.message}`);
        dispatch(setGetAllOperator(''))
        dispatch(setFetchOpreator(''))
        dispatch(setFetchPlan(''))
        dispatch(setLoading(false));
        return data;
      }
    
    } catch {
       Alert.alert("ERROR", "Something went wrong while processing the recharge");
        dispatch(setLoading(false));
    }

    
  }, [getApiHeaders,dispatch]);

  return {
    getAllOperatorsApi,
    fetchOperatorByMobile,
    PayRechargeNow
  };
};