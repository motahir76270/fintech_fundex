import { setContactData, setServies } from "@/redux/services/serviceSlice";
import { setBalance } from "@/redux/wallet/walletSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";


import Constants from 'expo-constants';
import { router } from "expo-router";
import { Alert } from "react-native";
  
const baseURL = Constants.expoConfig?.extra?.API_URL;

export const getAllServices = async(dispatch:any)=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any); 
    
    
    if(!keyData?.header_key || !keyData?.header_token){
        return;
    }

    const res = await fetch(`${baseURL}/api/services`,{
        method:"GET",
        headers:{
           "headerKey": keyData?.header_key,
          "headerToken": keyData?.header_token,
        }
    })
    const data = await res.json();
    // console.log("==",JSON.stringify(data.data));
    if(data?.status === "SUCCESS"){
      dispatch(setServies(data.data))
    }else{
        router.replace('/(auth)/login')
        Alert.alert(`${data?.status}` , `${data?.message}`)
    }
}

export  const fetchBalance = async(dispatch:any)=> {
       const datas = await AsyncStorage.getItem('user');       
       const keyData = JSON.parse(datas as any)
       
       if(!keyData?.header_key || !keyData?.header_token){
          return;
       }
          const res = await fetch(`${baseURL}/api/wallet`,{
            method:"GET",
            headers:{
            "headerKey": keyData?.header_key,
            "headerToken": keyData?.header_token,
            }
          })         
        const data = await res.json();
          if(data.status === "SUCCESS"){
             dispatch(setBalance(data));
             return data;
           }else{
             Alert.alert(`${data.status}` , `${data.message}`)
           }
    }


export const getComissionPlan = async()=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
    
    const res = await fetch(`${baseURL}/api/get-commission-plans`,{
        method:"GET",
        headers:{
           "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    const data = await res.json()
    return data
}


export const getSupportType = async()=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
     if(!keyData){
        return;
      }
    const res = await fetch(`${baseURL}/api/support/supprt-type`,{
        method:"GET",
        headers:{
           "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    const data = await res.json()
   
    
    
    return data
}

export const CreateticketApiCall = async(payload:any)=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
    console.log(keyData);
    
    const res = await fetch(`${baseURL}/api/support/create-ticket`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers:{
          "Content-Type": "application/json",
           "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    const data = await res.json()
    return data
}    


export const ContactDataApiCall = async(dispatch:any) => {
        const datas = await AsyncStorage.getItem('user');       
       const keyData = JSON.parse(datas as any)
       
       if(!keyData?.header_key || !keyData?.header_token){
          return;
       }
          const res = await fetch(`${baseURL}/api/contact-data`,{
            method:"GET",
            headers:{
            "headerKey": keyData?.header_key,
            "headerToken": keyData?.header_token,
            }
          })         
        const data = await res.json();
          if(data.status === "SUCCESS"){
             dispatch(setContactData(data.data));
             return data;
           }else{
           Alert.alert(`${data.status}` , `${data.message}`)
           }
}

