import { Tabs } from "expo-router";
import { useAuth } from "@/AuthContext";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function RootLayout() {
  const { user, loading } = useAuth();
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
        },
      }}
    >
      <Tabs.Screen
        name="createOrg"
        options={{
          title: "Create Organization",
          tabBarIcon: () => (
            <MaterialIcons
              size={28}
              name="create"
              color={colors.buttonText}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: () => (
            <MaterialIcons
              size={28}
              name="dashboard"
              color={colors.buttonText}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: () => (
            <MaterialIcons
              size={28}
              name="person"
              color={colors.buttonText}
            />
          ),
        }}
      />
    </Tabs>
  );
}
