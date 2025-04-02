import { router, Stack, Tabs } from "expo-router";
import { useAuth } from "@/AuthContext";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Platform, useColorScheme } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
//You absolutely need an index in every folder including tabs it can be renamed through styling
export default function RootLayout() {
  const {user, loading} = useAuth();
  const colorScheme = useColorScheme();
  
    return (
        <Tabs screenOptions={{ headerShown: false}}>
          <Tabs.Screen name="createOrg" options={{
                title: "Create Organization",
                tabBarIcon: () => <MaterialIcons size={28} name='create' color={'blue'} />
                }}
            />
          <Tabs.Screen name="dashboard" options={{
            title: "Home",
            tabBarIcon: () => <MaterialIcons size={28} name='dashboard' color={'blue'} />
            }}
            />
          <Tabs.Screen name="profile" options={{
            title: "Profile",
            tabBarIcon: () => <MaterialIcons size={28} name='person' color={'blue'} />
            }}
            />
        </Tabs>
    )
  }
  