import { setAepsData, setPidOptionWadh } from "@/redux/aeps/aepsSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
import { router } from "expo-router";
import { Alert, LogBox } from "react-native";
  
const baseURL = Constants.expoConfig?.extra?.API_URL;

export const getAepsKycStatus = async(dispatch:any)=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
     if(!keyData){
        return;
      }

    const res = await  fetch(`${baseURL}/api/aeps/checkKyc`,{
        method:"GET",
        headers:{
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    const data = await res.json();
     
    
    if(data?.status === "SUCCESS"){
      dispatch(setAepsData(data))
    }else{
        Alert.alert(`${data?.status}` , `${data?.message}`)
    }
    return data
}

export const aepsStatusCheck = async(dispatch :any)=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
     if(!keyData){
        return;
      }
    
      try {
      
    const res = await  fetch(`${baseURL}/api/aeps/aeps-status-check`,{
        method:"POST",
        headers:{
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
        const data = await res.json();
         Alert.alert(`${data?.AepskycData?.status}`, data.status);
         await AsyncStorage.setItem("aepsStatus", JSON.stringify(data.AepskycData));
         const aspaResSatatusData = await AsyncStorage.getItem("aepsStatus");
         dispatch(setPidOptionWadh(JSON.parse(aspaResSatatusData as any)));
  
       } catch (error:any) {
         Alert.alert("Failed", error?.message || error)
      }
}

export const doAepsKycApiCall = async(payload:any ,dispatch:any)=> {
  
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);  
     
    const res = await fetch(`${baseURL}/api/aeps/dokyc/min`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers:{
          "Content-Type": "application/json",
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    
    const data = await res.json();  
    return data ;
}

export const varifyAepsKycApiCall = async(payload:any ,dispatch:any)=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
    
    const res = await fetch(`${baseURL}/api/aeps/verify-otp`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers:{
          "Content-Type": "application/json",
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })

    const data = await res.json();
    if(data?.status === "SUCCESS"){
      router.push('/screen/aepsKyc/varifyFinger');
    }else{
      Alert.alert(`${data?.status}`, `${data?.message}`)
    }
  
  return data ;
  
}

export const varifyAepsKycFingerApiCall = async(payload:any ,dispatch:any)=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
    
    const res = await fetch(`${baseURL}/api/aeps/verify-finger`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers:{
          "Content-Type": "application/json",
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    // console.log("Finger varify response:", payload);
     
    const data = await res.json();
    
  if(data.status === "SUCCESS"){
    Alert.alert(`${data?.status}`, `${data?.message}`)
    router.push('/screen/aepsKyc/twoFactorAuthontication');
  }else{
    Alert.alert(`${data?.status}`, `${data?.message}`)
  }
  
}

export const twoFactAuthAepsKycApiCall =async(pidData:any ,location:any)=>{
      const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
     const payload={
      ...pidData,
        lat:location.latitude,
        log:location.longitude
     }
    // console.log("TFA payload response:", payload);

    const res = await fetch(`${baseURL}/api/aeps/tfa-verification`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers:{
          "Content-Type": "application/json",
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    
    const data = await res.json();
    
     return data;
}

export const getDeviceApiCall = async()=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
    
    const res = await  fetch(`${baseURL}/api/getrdname`,{
        method:"GET",
        headers:{
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    const data = await res.json();
     
    return data;
}


