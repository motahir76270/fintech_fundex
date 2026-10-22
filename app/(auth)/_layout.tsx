import React from 'react'
import { Stack } from 'expo-router'

const AuthLayout = () => {
  return (
    <Stack initialRouteName='login' screenOptions={{headerShown:false}} >
    <Stack.Screen name='intialPage' options={{headerShown:false}}  /> 
    <Stack.Screen name='login' options={{headerShown:false}}  /> 
    <Stack.Screen name='signup' options={{headerShown:false , title:"SignUp"}}  /> 
    <Stack.Screen name='pin' options={{headerShown:false }}  /> 
    <Stack.Screen name='forgetPassword' options={{headerShown:true , title:"Forget Password"}}  /> 
    <Stack.Screen name='forgetPin' options={{headerShown:true , title:"Forget PIN"}}  /> 
    <Stack.Screen name='doKyc' options={{headerShown:false , title:"KYC Form"}}  /> 
    </Stack>
  )
}

export default AuthLayout