import { createSlice } from "@reduxjs/toolkit";


const customerSlice = createSlice({
  name: 'customer',
  initialState: {
    list: {},
    allMember:{}
  },
  reducers: {
    setCustomer: (state,actions) => {
      state.list =  actions.payload;
    },
     setMember: (state,actions) => {
      state.allMember =  actions.payload;
    },
    
  }
})

export const { setCustomer, setMember } = customerSlice.actions

export default customerSlice.reducer ;