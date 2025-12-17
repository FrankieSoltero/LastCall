import { AuthProvider } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { PortalHost } from '@rn-primitives/portal';
import "./global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack />
      <PortalHost />
    </AuthProvider>
  )
}
