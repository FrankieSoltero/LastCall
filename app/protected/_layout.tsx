import { router, Stack } from "expo-router";
import { useAuth } from "@/AuthContext";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Platform, useColorScheme } from "react-native";

//You absolutely need an index in every folder including tabs it can be renamed through styling
export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false}}>
          <Stack.Screen name="(tabs)"/>
        </Stack>
    )
  }
  