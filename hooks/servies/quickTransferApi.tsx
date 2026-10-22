import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// import { Alert } from 'react-native';

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

export const FetchAccountDetailsApi = async (mobile: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${baseURL}/api/qtransfer/fetch-account`, {
    method: "POST",
    body: JSON.stringify({ mobile }),
    headers,
  });
  const data = await res.json();
  //    console.log(data.data?.qtAccounts);
  return data;
};

export const initiateTransactionApi = async (formData: any) => {
  const payload = {
    amount: formData?.amount,
    account: formData?.accountNumber,
    ifsc: formData?.ifscCode,
    mobile: formData?.mobileNumber,
    name: formData?.name,
  };

  const headers = await getAuthHeaders();

  const res = await fetch(`${baseURL}/api/qtransfer/initiate-transaction`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers,
  });

  const data = await res.json();
  console.log(data);

  return data;
};

export const QuickTrasnferDoTransactionApi = async (payload: any) => {
  console.log(payload);

  const headers = await getAuthHeaders();
  const res = await fetch(`${baseURL}/api/qtransfer/qt-do-transaction`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers,
  });
  const data = await res.json();
  console.log(data);

  console.log(data.data.recentQtTxn);

  return data;
};

export const getAllBankIfscApi = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${baseURL}/api/qtransfer/getAllBankIfsc`, {
    method: "GET",
    headers,
  });
  const data = await res.json();
  return data;
};

export const accountVerify = async (payload: any) => {
  const headers = await getAuthHeaders();
   console.log(headers);
   
    console.log(payload);

  const res = await fetch(`${baseURL}/api/qtransfer/accountVerify`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers,
  });
  const data = await res.json();

  console.log(data);
  return data;
};

export const accountDeleteApiCall = async (id: any) => {
  const headers = await getAuthHeaders();

    console.log(id);

  const res = await fetch(`${baseURL}/api/qtransfer/accountDelete`, {
    method: "POST",
    body: JSON.stringify({id}),
    headers,
  });
  const data = await res.json();

  return data;
};
