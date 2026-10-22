import { createSlice } from "@reduxjs/toolkit";


const rechargeSlice = createSlice({
  name: 'recharge',
  initialState: {
    getAllOperator:[],
    fetchOperator:"",
    showOperators:false,
    fetchPlan:[],
    plan: null,
    loading: false,
    error:null
  },
  reducers: {
    setGetAllOperator: (state,actions) => {
      state.getAllOperator =  actions.payload;
    },
    setFetchOpreator: (state,actions) => {
      state.fetchOperator =  actions.payload;
    },
    setFetchPlan: (state,actions) => {
      state.fetchPlan =  actions.payload;
    },
     setPlan: (state,actions) => {
      state.plan =  actions.payload;
    },
     setLoading: (state,actions) => {
      state.loading =  actions.payload;
    },
     setError: (state,actions) => {
      state.error =  actions.payload;
    },
    setShowOperators: (state,actions) => {
      state.showOperators =  actions.payload;
    },

  }
})

export const { setGetAllOperator, setFetchOpreator, setFetchPlan, setLoading, setError, setShowOperators, setPlan } = rechargeSlice.actions

export default rechargeSlice.reducer ;