import { AuthProvider } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { PortalHost } from '@rn-primitives/portal';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{
        headerShown: false
      }} />
      <PortalHost />
    </AuthProvider>
  )
}
