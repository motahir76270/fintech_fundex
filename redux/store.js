import { configureStore } from "@reduxjs/toolkit";
import authReducer from './auth/authSlice'
import costomerReducer from './customer/cutomerSlice'
import walletReducer from './wallet/walletSlice'
import servicesReducer from './services/serviceSlice'
import rechargeReducer from "./recharge/rechargeSlice"
import dmtReducer from "./dmt/dmtSlice"
import aepsReducer from "./aeps/aepsSlice"
import qtReducer from "./quickTransfer/qtSlice"

export const store = configureStore({
  reducer:{
    auth: authReducer,
    customer: costomerReducer,
    wallet: walletReducer,
    services: servicesReducer,
    recharge: rechargeReducer,
    dmt: dmtReducer,
    qt: qtReducer, 
    aeps: aepsReducer,
  },
})