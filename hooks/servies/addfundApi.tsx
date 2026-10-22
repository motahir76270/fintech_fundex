import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from 'expo-constants';
import { Alert } from "react-native";
  
const baseURL = Constants.expoConfig?.extra?.API_URL;

export const GetBanklistApiCall = async(dispatch:any)=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
    // console.log(keydata);
    
    const res = await axios.get(`${baseURL}/api/addfund-banklist`,{
        method:"GET",
        headers:{
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    const data = await res.data
    return data;
}


export const TopUpApicall = async(payload:any)=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
  
    try {
    
    const res = await fetch(`${baseURL}/api/topup`,{
        method:"POST",
        body: payload,
        headers:{
          'Content-Type': 'multipart/form-data',
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })


    const data = await res.json()
      return data ;
     } catch  {
        Alert.alert("Error", "Something went wroung")
    }
}

