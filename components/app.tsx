
import React from 'react'
import { Stack } from 'expo-router'

export const unstable_settings = {
  anchor: '(tabs)',
};
const AllStackScreen = () => {

  return (
       <Stack initialRouteName='(tabs)'  screenOptions={{headerShown:false}} >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="screen/pendingKyc" options={{ headerShown: false, title:"KYC STATUS" }} />
        <Stack.Screen name="screen/cardId" options={{ headerShown: false }} />
        <Stack.Screen name="screen/profile" options={{ headerShown: false }} />
        <Stack.Screen name="screen/changePassword" options={{ headerShown: false }} />
        <Stack.Screen name="screen/changePin" options={{ headerShown: false }} />
        <Stack.Screen name="screen/commisionPlan" options={{ headerShown: false }} />
        <Stack.Screen name="screen/raiseTicket" options={{ headerShown: false }} />
        <Stack.Screen name="screen/policy" options={{ headerShown: false }} />
        <Stack.Screen name="screen/termsCondition" options={{ headerShown: false }} />
        <Stack.Screen name="screen/refundCancil" options={{ headerShown: false }} />
        <Stack.Screen name="screen/addMember" options={{ headerShown: false }} />

        <Stack.Screen name="history/[id]" options={{ headerShown: false }} />
        
        <Stack.Screen name="screen/collection/mobileRecharge" options={{ headerShown: false }} />
        <Stack.Screen name="screen/collection/dmt/remiitEKYC" options={{ headerShown: false }} />
        <Stack.Screen name="screen/collection/dmt/remitAcount" options={{ headerShown: false }} />
        <Stack.Screen name="screen/collection/payout" options={{ headerShown: false }} />
        <Stack.Screen name="screen/collection/quickTransfer" options={{ headerShown: false }} />
        <Stack.Screen name="screen/collection/uti" options={{ headerShown: false }} />
        <Stack.Screen name="screen/collection/cashpoint" options={{ headerShown: false }} />

        <Stack.Screen name="screen/aepsKyc/doAepsKyc" options={{ headerShown: false }} />
        <Stack.Screen name="screen/aepsKyc/varifyFinger" options={{ headerShown: false }} />
        <Stack.Screen name="screen/aepsKyc/twoFactorAuthontication" options={{ headerShown: false }} />

        <Stack.Screen name="screen/bankService/balanceEnquery" options={{ headerShown: false }} />
        <Stack.Screen name="screen/bankService/cashWithdraw" options={{ headerShown: false }} />
        <Stack.Screen name="screen/bankService/statement" options={{ headerShown: false }} />
        <Stack.Screen name="screen/bankService/aepsService" options={{ headerShown: false }} />

        <Stack.Screen name="screen/AddFund" options={{ headerShown: false }} />


      </Stack>
  )
}

export default AllStackScreen
