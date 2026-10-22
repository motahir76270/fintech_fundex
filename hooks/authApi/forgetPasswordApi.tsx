import { setForgetData } from "@/redux/auth/authSlice";
// import axios from "axios";
// import { router } from "expo-router";

import Constants  from 'expo-constants';
import { Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";


const baseURL = Constants.expoConfig?.extra?.API_URL
 
export const forgetPasswordApiCall = async(data:any,dispatch:any)=> {
  const payload = { email : data?.identifier }
  const response = await fetch(
    `${baseURL}/api/forgot/password`,{
        method:"POST",
        body: JSON.stringify(payload),
        headers: {
            "Content-Type": "application/json",
        },
    }
  );
     const resData = await response.json();

   //   console.log("SUCCESS:", resData);
     if(resData?.status === "SUCCESS"){
        Alert.alert(`${resData?.status}`, `${resData?.message}`)
        dispatch(setForgetData(resData));
      //   router.push('/(auth)/forgetPassword');
     }else{
        Alert.alert(`${resData?.status}`, `${resData?.message}`)
     }

   return resData;  
}


export const forgetPinApiCall = async(data:any,dispatch:any)=> {
    const payload = { email : data?.identifier }
  const response = await fetch(
    `${baseURL}/api/forgot/pin`,{
        method:"POST",
        body: JSON.stringify(payload),
        headers: {
            "Content-Type": "application/json",
        },
    }
  );
     const resData = await response.json();
     
     if(resData?.status === "SUCCESS"){
        Alert.alert(`${resData?.status}`, `${resData?.message}`)
        dispatch(setForgetData(resData));
      //   router.push('/(auth)/forgetPin');
     }else{
        Alert.alert(`${resData?.status}`, `${resData?.message}`)
     }

   return resData;  
}

export const pinChangeApiCall = async(payload:any) => {
         const logindata=  await AsyncStorage.getItem('user');
       const keyData = JSON.parse(logindata as any);
   

       const res = await fetch(`${baseURL}/api/update-pin`,{
        method:"POST",
        body: JSON.stringify(payload),
        headers:{
           Accept: "application/json",
          "Content-Type":"application/json",
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
      })
      
      const data = await res.json();
      return data;
}

export const passwordChangeApiCall = async(payload:any) => {
        const logindata=  await AsyncStorage.getItem('user');
       const keyData = JSON.parse(logindata as any);
        const res = await fetch(`${baseURL}/api/update-password`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers:{
           Accept: "application/json",
          "Content-Type":"application/json",
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
      })
          const data = await res.json();
          return data;
}