import { Stack, Slot, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "@/AuthContext";
import { useEffect } from "react";
import { Platform } from "react-native";
import React from "react";
//You absolutely need an index in every folder including tabs it can be renamed through styling

export default function RootLayout() {
  return (
       <Slot />
  );
}
