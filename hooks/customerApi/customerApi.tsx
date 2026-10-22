import { setCustomer } from '@/redux/customer/cutomerSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

 
 const baseURL = Constants.expoConfig?.extra?.API_URL

   export   const getCustomer = async(dispatch:any)=>{
       const logindata=  await AsyncStorage.getItem('user');
       const keyData = JSON.parse(logindata as any);
       if(!keyData){
        return;
       }
      const {data} = await axios.get(`${baseURL}/api/view-profile`,{
        headers:{
           "headerKey": keyData.header_key,
          "headerToken": keyData.header_token,
        }
      })
       
       await AsyncStorage.setItem('customer' ,JSON.stringify(data) )
        const datas = await AsyncStorage.getItem('customer' )
        dispatch(setCustomer(JSON.parse(datas as any)))
      
    }
    