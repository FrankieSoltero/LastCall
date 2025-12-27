import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Slot, useRouter, useSegments } from "expo-router";
import { PortalHost } from '@rn-primitives/portal';
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Cache persists for 10 minutes
      retry: 2,
      refetchOnWindowFocus: false, // Don't refetch on app focus (mobile optimization)
    },
  },
});

function InitialLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Set up push notifications when user is logged in

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InitialLayout />
        <PortalHost />
      </AuthProvider>
    </QueryClientProvider>
  )
}
