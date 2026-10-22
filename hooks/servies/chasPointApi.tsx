import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';


const baseURL = Constants.expoConfig?.extra?.API_URL;

const getAuthHeaders = async () => {
  const datas = await AsyncStorage.getItem("user");
  if (!datas) {
    throw new Error("No API keys found");
  }
  const keydata = JSON.parse(datas as any);


  return {
    "Content-Type":"application/json",
    "headerKey": keydata.header_key,
    "headerToken": keydata.header_token,
  };
};

export const GenerateQrcodeOfCashpointApiCall = async(payload:any)=> {
   const headers = await getAuthHeaders();
   console.log(payload);
   
    const res = await fetch(`${baseURL}/api/upi/iserveu/qr`,{
        method:"POST",
        body: JSON.stringify(payload),
        headers
    })
    const data = await res.json()
    console.log(data);
    
    return data
}

export const checkPaymentStatusOfCashpointApiCall = async(payload:any)=> {
   const headers = await getAuthHeaders();
   console.log(payload);
   
    const res = await fetch(`${baseURL}/api/upi/iserveu/status`,{
        method:"POST",
        body: JSON.stringify(payload),
        headers
    })
    const data = await res.json()
    console.log("sfahssfaj",data);
    
    return data
}