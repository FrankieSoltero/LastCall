import { Stack, Slot, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "@/AuthContext";
import { useEffect } from "react";
import { Platform } from "react-native";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
//You absolutely need an index in every folder including tabs it can be renamed through styling

export default function RootLayout() {
  return ( 
    <GestureHandlerRootView style={{flex:1}}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{title: 'Sign In'}}/>
          <Stack.Screen name="createaccount" options={{title: 'Create Account'}}/>
          <Stack.Screen name="invite" />
          <Stack.Screen name="(protected)" options={{headerShown: false}}/>
          <Stack.Screen name="+not-found"/>
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
