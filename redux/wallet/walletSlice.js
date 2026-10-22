import { createSlice } from "@reduxjs/toolkit";


const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance:'',
    walletToWallet:''
  },
  reducers: {
    setBalance: (state,actions) => {
      state.balance =  actions.payload;
    },
    setWalletToWallet: (state,actions) => {
        state.walletToWallet = actions.payload
    }
  }
})

export const { setBalance ,setWalletToWallet} = walletSlice.actions

export default walletSlice.reducer ;