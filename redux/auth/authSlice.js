import { createSlice } from "@reduxjs/toolkit";


const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: {},
    login:{},
    Login_verify:'',
    forgetPasword:'',
    forgetPIN:'',
    dokycs:''
  },
  reducers: {
    setUser: (state,actions) => {
      state.user =  actions.payload;
    },
    setLogin: (state,actions)=> {
      state.login = actions.payload ;
    },
    login_varify: (state,actions)=> {
      state.Login_verify = actions.payload;
    },
    setForgetData: (state,actions)=> {
      state.forgetPasword = actions.payload
    },
    setForgetPin: (state,actions)=> {
      state.forgetPIN = actions.payload
    },
    setDokycs:(state,actions)=> {
      state.dokycs = actions.payload
    }
  }
})

export const { setUser ,setLogin,login_varify,setForgetData,setForgetPin } = authSlice.actions

export default authSlice.reducer ;