import { Stack } from "expo-router";
import { useAuth } from "@/AuthContext";
import React from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
//You absolutely need an index in every folder including tabs it can be renamed through styling

export default function RootLayout() {
  const {user, loading} = useAuth();
    return (
      <Stack>
        <Stack.Screen name="createOrg" options={{title: "Create Organization"}}/>
        <Stack.Screen name="dashboard" options={{title: "Home"}}/>
        <Stack.Screen name="profile" options={{title: "Profile"}}/>
        <Stack.Screen name="memberOrganizations/[orgId]" options={{headerShown: false}}/>
        <Stack.Screen name="adminOrganizations/[orgId]" options={{headerShown: false}}/>
      </Stack>
    )
  }
  