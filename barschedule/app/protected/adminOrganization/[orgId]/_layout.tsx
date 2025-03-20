import { Stack, Slot, useRouter, router, useNavigation, Href, useLocalSearchParams } from "expo-router";
import { AuthProvider, useAuth } from "@/AuthContext";
import { useEffect, useState } from "react";
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View, Text } from "react-native";
import React from "react";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { RouteParams } from "@/constants/DataSetUps";

//You absolutely need an index in every folder including tabs it can be renamed through styling
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false}}/>
    </Stack>
  )
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flex: 1,
    backgroundColor: "#111d3e"
  },
  toggleButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1,
    padding: 10,
    borderRadius: 5,
  },
  sideBar: {
    width: 200,
    backgroundColor: "#d4f4b3",
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    position: "absolute",
    height: Dimensions.get("window").height,
  },
  sideBarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sideBarLink: {
    fontSize: 16,
    paddingVertical: 10,
    color: "#111d3e",
  },
  mainContent: {
    flex: 1,
    padding: 16,
    marginLeft: 20,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20
  },
  iconWithText: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d4f4b3"
  }
});
