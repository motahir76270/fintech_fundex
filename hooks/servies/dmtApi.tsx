import { deletedAccount } from '@/redux/dmt/dmtSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Alert } from 'react-native';


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

export const getAllBanklist = async() =>{
  const keydata = JSON.parse( await AsyncStorage.getItem('user') as any)
    const res = await fetch(`${baseURL}/api/dmt/bank-list`,{
      method:"GET",
      headers:{
        "headerKey": keydata.header_key,
        "headerToken": keydata.header_token,
      }
    })

    const data = await res.json();
    
    return data;
}

// 🔹 Get all account links
export const getAllAccountLink = async () => {
  try {
    const headers = await getAuthHeaders();
    // const mobiledata = await AsyncStorage.getItem('mobile') 
    const dmtdata = JSON.parse( await AsyncStorage.getItem('dmtData') as any)

    //  console.log("====", JSON.parse(mobiledata as any));
    const payload = {
      dmtKey:dmtdata.dmtKey
    }
    const  res  = await fetch(`${baseURL}/api/dmt/data`, {
      method:"POST",
      body:JSON.stringify(payload),
      headers
    });    
    const data = await res.json();
    // console.log(data.data.dmtData);
    
    return data;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
};

// 🔹 Create new bank account
export const newBankAccount = async (payloadData: any,userDmtData:any) => {
    const keydata = await AsyncStorage.getItem('user');
   
  const sesionkey =  JSON.parse(keydata as any);
     
    const payload = {
        name: payloadData.name,
        bid:payloadData.bankId,
        ifsc: payloadData.ifsc,
        account:payloadData.accountNo,
        pincode: payloadData.pincode,
        dob: payloadData.dob,
        dmtKey: userDmtData.dmtKey
    }
    console.log(payload);
    
    
    const res = await fetch(
      `${baseURL}/api/dmt/add-bank-account`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers:{
              "Content-Type":"application/json",
              "headerKey": sesionkey.header_key,
              "headerToken":sesionkey.header_token,
        }
         }
    );

    const data = await res.json();
   console.log(data);
   
    return data;
};

// 🔹 Delete account
export const deleteAccount = async (id: string,dispatch:any) => {
  try {
    const headers = await getAuthHeaders();
   
    const dmtdata = await AsyncStorage.getItem('dmtData');
    const dmtkey =  JSON.parse(dmtdata as any)

     const payload = {
        beneId:id,
        dmtKey: dmtkey.dmtKey
     }
     
    const res = await fetch(
      `${baseURL}/api/dmt/delete-bank-account`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers }
    );
    
    const data = await res.json();
    console.log(data);
    if(data?.status === "SUCCESS"){
        Alert.alert( `${data?.status}`,`${data?.message}`)
        dispatch(deletedAccount({beneid:id}))
    }else{
        Alert.alert( `${data?.status}`,`${data?.message}`)
    }
    return data;
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};

export const dmtlogout = async()=> {
  const headers = await getAuthHeaders();
  const dmtdata = await AsyncStorage.getItem('dmtData');
  const dmtkey =  JSON.parse(dmtdata as any)

   const payload= {
    dmtKey:dmtkey.dmtKey
   }
   console.log("==",dmtkey);
   
  const res = await fetch(`${baseURL}/api/dmt/logout`,{
     method:"POST",
     body:JSON.stringify(payload),
    headers
  })
  
  const data = await res.json();
   if(data?.status === "SUCCESS"){
      Alert.alert(`${data?.status}`, `${data?.message}`)
   }else{
      Alert.alert(`${data?.status}`, `${data?.message}`)
   }
}

//varify aaddhadr e-kyc
export const VarifyAddharKycApiCall = async(AadhaarNumber:any,PidData:any, location:any)=> {
  const dmtdata = JSON.parse( await AsyncStorage.getItem('dmtData') as any)
  const mobileData = JSON.parse( await AsyncStorage.getItem('mobile') as any)
   
  const payload = {
    mobile:mobileData.phone,
    lat:String(location.latitude),
    log:String(location.longitude),
    newFingerData:PidData,
    aadhar:AadhaarNumber,
    dmtKey:dmtdata?.dmtKey
  }
    
    const headers = await getAuthHeaders();
   
     const res = await fetch(`${baseURL}/api/dmt/kyc`,{
      method:"POST",
      body:JSON.stringify(payload),
      headers
     })

     const data = await res.json();
     console.log("===============data",data);

     return data;
     
}

export const VarifyOtpApiCall = async(FormData:any)=> {
  const dmtdata = JSON.parse( await AsyncStorage.getItem('dmtData') as any)

  const payload = {
    otp:FormData,
    dmtKey:dmtdata?.dmtKey
  }
    console.log(payload);
    
    const headers = await getAuthHeaders();
   
     const res = await fetch(`${baseURL}/api/dmt/register`,{
      method:"POST",
      body:JSON.stringify(payload),
      headers
     })

     const data = await res.json();
     console.log("===============data",data);

     return data;
     
}


export const dmtAccountVarificationApiCall =  async(formdata:any)=> {
  const mobiledata = JSON.parse( await AsyncStorage.getItem('mobile') as any)
  const headers = await getAuthHeaders();
   const payload= {
      benename:formdata.bankname,
      mobile: mobiledata.phone,
      bene_id:formdata.bene_id,
      bankid:formdata.bankid,
      accno:formdata.accno,
      ifsc:formdata.ifsc
   }

try {  
  const res = await fetch(`${baseURL}/api/dmt/dmt-account-verify`,{
     method:"POST",
     body:JSON.stringify(payload),
     headers
  })
  const data  = await res.json();
    if(data?.status === "SUCCESS"){
      Alert.alert(`${data?.status}`, `${data?.message}`)
   }else{
      Alert.alert(`${data?.status}`, `${data?.message}`)
   }

   } catch (error:any) {
     Alert.alert("Error", `${error}`)
} 
    
}

//initae dmt transaction
export const DmtTransactionInitiate =  async(formData:any,selectedAccount:any)=> {
  const dmtdata = await AsyncStorage.getItem('dmtData');
  const dmtkey =  JSON.parse(dmtdata as any)
  const headers = await getAuthHeaders();
  
   const payload= {
      dmtKey:dmtkey.dmtKey,
      beneId:selectedAccount?.bene_id,
      mode:formData?.paymentMode,
      amount:formData?.amount,
      ifsc:selectedAccount?.ifsc
   }
   
  const res = await fetch(`${baseURL}/api/dmt/initiate-transaction`,{
     method:"POST",
     body:JSON.stringify(payload),
     headers
  })
  const data  = await res.json();
  
 return data;
}

export const dmtTransferOtpApiCall =  async(formData:any)=> {
  const dmtdata = await AsyncStorage.getItem('dmtData');
  const dmtkey =  JSON.parse(dmtdata as any)
  const headers = await getAuthHeaders();
  
   const payload= {
      dmtKey:dmtkey.dmtKey,
      ...formData
   }
   
  const res = await fetch(`${baseURL}/api/dmt/do-transaction`,{
     method:"POST",
     body:JSON.stringify(payload),
     headers
  })
  const data  = await res.json();
  
 return data;
}









