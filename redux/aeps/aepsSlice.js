import { createSlice } from "@reduxjs/toolkit";


const aepsSerivesSlice = createSlice({
  name: 'aeps',
  initialState: {
    getAepsData:'',
    pidOptionWadh:'',
    aepsOtp:''
  },
  reducers: {
    setAepsData: (state,actions) => {
      state.getAepsData =  actions.payload;
    },
    setPidOptionWadh: (state,actions) => {
      state.pidOptionWadh =  actions.payload;
    }, 
     setAepsOtp: (state,actions) => {
      state.aepsOtp = actions.payload;
    },
  }
})

export const { setAepsData, setPidOptionWadh ,setAepsOtp } = aepsSerivesSlice.actions

export default aepsSerivesSlice.reducer ;