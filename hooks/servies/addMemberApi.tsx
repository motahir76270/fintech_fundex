
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';



const baseURL = Constants.expoConfig?.extra?.API_URL;

// 🔹 Helper to get headers
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


export const addMemberApiCall = async(payload:any)=> {
   const headers = await getAuthHeaders();
    
    const res = await fetch(`${baseURL}/api/add-member`,{
        method:"POST",
        body: JSON.stringify(payload),
        headers
    })
    const data = await res.json()
    console.log(data);
    
    return data
}


export const getMemeberRole = async()=> {
   const headers = await getAuthHeaders();
    
    const res = await fetch(`${baseURL}/api/memberRole`,{
        method:"GET",
        headers
    })
    const data = await res.json()
    console.log(data);
    
    return data
}


export const getAllMemeber = async()=> {
   const headers = await getAuthHeaders();
    
    const res = await fetch(`${baseURL}/api/member-list`,{
        method:"GET",
        headers
    })
    const data = await res.json()
    return data
}

