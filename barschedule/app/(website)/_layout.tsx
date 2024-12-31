import { Stack, Slot, useRouter, Redirect } from "expo-router";
import { AuthProvider, useAuth } from "@/AuthContext";
import { useEffect } from "react";
import { Platform, Text } from "react-native";
import React from "react";
//You absolutely need an index in every folder including tabs it can be renamed through styling

export default function RootLayout() {
  const {user, loading} = useAuth();

  if (loading){
    return <Text>Loading...</Text>;
  }
  if (!user){
    return <Redirect href="/"/>
  }
  return <Slot/>
}
