import { createSlice } from "@reduxjs/toolkit";


const serivesSlice = createSlice({
  name: 'services',
  initialState: {
    AllServices:'',
    getLocation:'',
    contactData:'',
    stateRole:''
  },
  reducers: {
    setServies: (state,actions) => {
      state.AllServices =  actions.payload;
    },
    setLocation:(state,actions)=> {
      state.getLocation = actions.payload;
    },
    setContactData:(state,actions)=> {
      state.contactData = actions.payload;
    },
     setRoleState:(state,actions)=> {
      state.stateRole = actions.payload;
    },
   
  }
})

export const { setServies ,setLocation,setContactData,setRoleState} = serivesSlice.actions

export default serivesSlice.reducer ;