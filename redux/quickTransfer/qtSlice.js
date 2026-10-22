import { createSlice } from "@reduxjs/toolkit";


const qtSlice = createSlice({
  name: 'qt',
  initialState: {
    quickTranfer: ''
  },
  reducers: {
    setQTData: (state,actions) => {
      state.quickTranfer =  actions.payload;
    },
    deletedAccount: (state, action) => {
    const { beneid  } = action.payload;

    state.quickTranfer = state.quickTranfer.filter(
    (item) => item.bene_id !== beneid
  );
},
  }
})

export const { setQTData ,deletedAccount} = qtSlice.actions

export default qtSlice.reducer ;