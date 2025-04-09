import { Dimensions, Platform, StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { Drawer } from 'expo-router/drawer';
import { useLocalSearchParams, useRouter } from "expo-router";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function RootLayout() {
  const params = useLocalSearchParams();
  const orgId = params.orgId as unknown as string;
  const router = useRouter();
  const colors = useThemeColors();

  function GoHomeButton(props: any) {
    return (
      <DrawerContentScrollView {...props} style={{ backgroundColor: colors.background }}>
        <DrawerItemList {...props} />
        <TouchableOpacity 
          onPress={() => router.replace('/protected/dashboard')}
          style={{
            padding: 16,
            marginTop: 20,
            backgroundColor: colors.card,
            borderRadius: 4,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: colors.text }}>Go to Dashboard</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Drawer drawerContent={(props) => <GoHomeButton {...props} />}>
        <Drawer.Screen 
          name="index" 
          options={{ drawerLabel: 'Home', title: 'Dashboard' }} 
          initialParams={{ orgId }} 
        />
      </Drawer>
    </SafeAreaView>
  );
}
