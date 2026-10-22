import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const baseURL = Constants.expoConfig?.extra?.API_URL;

const getAuthHeaders = async () => {
  const datas = await AsyncStorage.getItem("user");
  if (!datas) {
    throw new Error("No API keys found");
  }
  const keydata = JSON.parse(datas as any);

  return {
    "Content-Type": "application/json",
    headerKey: keydata.header_key,
    headerToken: keydata.header_token,
  };
};

export const getBankApiCall = async() => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${baseURL}/api/getbank`, {
    method: "GET",
    headers,
  });
  const data = await res.json();
  return data; 
}

export const getBeneAccountDetailsApi = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${baseURL}/api/payout/get-accounts`, {
    method: "GET",
    headers,
  });
  const data = await res.json();
  //    console.log(data.data?.qtAccounts);
  return data;
};

export const addBeneAccountApical = async (payload: any) => {
  // Get authentication headers
  const headers = await getAuthHeaders();

  const res = await fetch(`${baseURL}/api/payout/add-account`, {
    method: "POST",
    headers: {
      ...headers, // spread auth headers
      "Content-Type": "multipart/form-data" // DO NOT set manually for FormData
    },
    body: payload, // should be FormData if uploading files
  });

  const data = await res.json();
  console.log(data);
  return data;
};


export const deleteBeneAccountApicall = async(id:any)=>{
     const headers = await getAuthHeaders();
     const res = await fetch(`${baseURL}/api/payout/delete-account`, {
         method: "POST",
         body:JSON.stringify({id}),
         headers:{
          ...headers,
          "Content-Type":"application/json"
         },
     });

   const data = await res.json();
     console.log(data);
     console.log(id);
     
  return data;   
}

export const initiateTransactionApiCall = async(payload:any) => {
    const headers = await getAuthHeaders();
     const res = await fetch(`${baseURL}/api/payout/initiate-transaction`, {
         method: "POST",
         body:JSON.stringify(payload),
         headers:{
          ...headers
         },
     });
      
   const data = await res.json();   
   
  return data;    
}

export const doTransactionApiCall = async(payload:any) => {
  // payload= otp  , txn_key
     const headers = await getAuthHeaders();
     const res = await fetch(`${baseURL}/api/payout/do-transaction`, {
         method: "POST",
         body:JSON.stringify(payload),
         headers:{
          ...headers,
          "Content-Type":"application/json"
         },
     });

   const data = await res.json();
   
  //    console.log(data.data?.qtAccounts);
  return data;    
}



