import { Stack, Slot, useRouter, router, Href } from "expo-router";
import { AuthProvider, useAuth } from "@/AuthContext";
import { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
//You absolutely need an index in every folder including tabs it can be renamed through styling
export default function RootLayout() {
  const {user, loading} = useAuth()
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? 'black' : 'white' }}>
      <AuthProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="index" options={{ title: 'Sign In' }} />
            <Stack.Screen name="createaccount" options={{ title: 'Create Account' }} />
            <Stack.Screen name="invite" />
            <Stack.Screen name="protected" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </SafeAreaView>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
