import axios from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import Constants  from 'expo-constants';



const baseURL = Constants.expoConfig?.extra?.API_URL 
export const loginStep1 = async(formData:any,dispatch:any,router:any)=> {
    try {
         const payload = {
            phone: formData.phone,
            password: formData.password,
            device: Device.deviceName,
            imei: Application.getAndroidId() 
         }
          
         const res = await fetch(`${baseURL}/api/login`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
              Accept : 'application/json',
             'Content-Type': 'application/json'
        }
     })
     
     
     const data = await res.json();

     
      
     if(data.status === "SUCCESS"){
        // Alert.alert(`${data?.status || 'SUCCESS'}`, `${data?.message || 'Login successful'}`)
        await AsyncStorage.setItem("keysdata" ,JSON.stringify(data));
        router.push('(auth)/pin')
     }else {
        Alert.alert(`Error:${data?.status}`, `${data?.message || 'Login failed'}`);
     }
    } catch {
        Alert.alert(`Error`, "Something went wrong. Please try again later.");
    }
     
}

export const Login_varify_btn = async(payload:any,dispatch:any,router:any)=> {
try {
    const res = await fetch(`${baseURL}/api/loginVerify`,{
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            Accept : 'application/json',
            'Content-Type': 'application/json'
        }
    })      
    const data = await res.json();
        
        if(data?.data?.accountkycstatus?.kyc === 'NO'){
             Alert.alert("user login succesfully", "user kyc is pending please e-KYC first");
             await AsyncStorage.setItem('user', JSON.stringify(data));  
             router.replace('/(auth)/doKyc');
             return data;
        }else if(data?.data?.accountkycstatus?.kyc === 'PENDING'){
            //  await AsyncStorage.setItem('user', JSON.stringify(data));  
            router.push('/screen/pendingKyc')
            return data;
        }else if(data?.data?.accountkycstatus?.kyc === 'YES'){
        //   Alert.alert(`${data?.status || 'SUCCESS'}`, `${data?.msg || 'user login Succfully'}`)
            await AsyncStorage.setItem('user', JSON.stringify(data));  
            router.replace('/(tabs)');
            return data;
        }else{
            Alert.alert(`Invalid Pin`, `Please enter a valid PIN`)
        }
} catch {
  Alert.alert("Error","something went wrong. Please check internet connection and try again later."); 
}

}

export const forgot_password = async(username:any,dispacth:any,router:any)=> {
   // console.log(username);
    
        const {data} = await axios.post(`${baseURL}/api/forget_password`, {username},{
        headers: {
             'Content-Type': 'application/json'
        }
        
    })
    console.log(data);
}

export const getSateRole = async () => {
      const res = await fetch(`${baseURL}/api/getRole`, {
        method: "GET"
      });
      const data = await res.json();
      return data; 
  };


