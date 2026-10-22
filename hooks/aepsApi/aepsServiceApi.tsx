
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
  
const baseURL = Constants.expoConfig?.extra?.API_URL;

export const aepsBalanceEnquiryApiCall = async(formData:any,pidata:any,getLocation:any)=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);

      const payload = {
      ...formData,
      ...pidata,
       lat:getLocation.latitude,
       log:getLocation.longitude
    }
    

    const res = await  fetch(`${baseURL}/api/aeps/balance-enquiry`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers:{
          "Content-Type":"application/json",
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    const data = await res.json();
    // console.log("balance enquiry data ", data);
     return data;
}

export const aepsMiniStateApiCall = async(formData:any,pidata:any,getLocation:any)=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
     
    const payload = {
      ...formData,
      ...pidata,
       lat:getLocation.latitude,
       log:getLocation.longitude
    }
    const res = await  fetch(`${baseURL}/api/aeps/mini-statement`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers:{
          "Content-Type":"application/json",
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    const data = await res.json();  
    console.log("min state", data);
      
     return data;
}

export const aepsWithdrawApiCall = async(formData:any,pidata:any,getLocation:any)=> {
  console.log(getLocation);
  
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);
      const payload = {
      ...formData,
      ...pidata,
       lat:getLocation.latitude,
       log:getLocation.longitude
    }
  
    const res = await  fetch(`${baseURL}/api/aeps/cash-withdrawal`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers:{
          "Content-Type":"application/json",
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })
    const data = await res.json();    
    console.log("widwar ddfdfgata ", data);
    
     return data;
}

export const aepsWithdrawOTPApiCall = async(formData:any,getLocation:any)=> {
    const datas = await AsyncStorage.getItem("user");
    const keyData = JSON.parse(datas as any);

      const payload = {
      ...formData,
       lat:getLocation.latitude,
       log:getLocation.longitude
    }
    await AsyncStorage.setItem("aepsPayLoad", JSON.stringify(payload));
    
    const res = await  fetch(`${baseURL}/api/aeps/aeps-cash-withdrawal-otp`,{
        method:"POST",
        body:JSON.stringify(payload),
        headers:{
          "Content-Type":"application/json",
          "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
    })


    const data = await res.json();    
    console.log("widwar data ", data);
    
     return data;
}

