
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
  
const baseURL = Constants.expoConfig?.extra?.API_URL;

export const getAllStateApiCall = async()=> {
       const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
    
    const res = await  fetch(`${baseURL}/api/getAllstate`,{
        method:"GET",
        headers:{
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    const data = await res.json();
    return data;
}

export const getAllBankApiCall = async()=> {
       const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
    
    const res = await  fetch(`${baseURL}/api/getbank`,{
        method:"GET",
        headers:{
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    const data = await res.json();
    return data;
}

export const updateAepsEkycApiCall = async(payload:any)=> {
       const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
    
    const res = await  fetch(`${baseURL}/api/aeps/updatedokyc`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers:{
          "Content-Type":"application/json",
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    const data = await res.json();
    return data;
}

