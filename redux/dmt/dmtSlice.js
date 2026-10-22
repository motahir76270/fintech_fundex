import { createSlice } from "@reduxjs/toolkit";


const dmtSlice = createSlice({
  name: 'dmt',
  initialState: {
    allDmtData: [],
    getAccountlist: []
  },
  reducers: {
    setDmtData: (state,actions) => {
      state.allDmtData =  actions.payload;
    },
    setNewAccount: (state,actions) => {
      state.getAccountlist = actions.payload
    },
    deletedAccount: (state, action) => {
    const { beneid  } = action.payload;

    state.getAccountlist = state.getAccountlist.filter(
    (item) => item.bene_id !== beneid
  );
},
  }
})

export const { setDmtData ,setNewAccount,deletedAccount} = dmtSlice.actions

export default dmtSlice.reducer ;