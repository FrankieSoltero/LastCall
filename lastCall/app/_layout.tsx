import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Slot, Stack, useRouter, useSegments } from "expo-router";
import { PortalHost } from '@rn-primitives/portal';
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

function InitialLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    
    const inAppGroup = segments[0] === '(app)';

    if (session && !inAppGroup) {
      router.replace('/(app)/forkPage');
    } else if (!session && inAppGroup) {
      router.replace('/(auth)/login');
    }
  }, [session, loading, segments]);
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617'}}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return <Slot screenOptions={{
    headerShown: false
  }} />
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
      <PortalHost />
    </AuthProvider>
  )
}
