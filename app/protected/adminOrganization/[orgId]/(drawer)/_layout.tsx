import { Dimensions, StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { Drawer } from 'expo-router/drawer'
import { useLocalSearchParams, useRouter } from "expo-router";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function RootLayout() {
  const params = useLocalSearchParams();
  const orgId = params.orgId as string;
  const router = useRouter();
  const colors = useThemeColors();

  function GoHomeButton(props: any) {
    return (
      <DrawerContentScrollView
        {...props}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <DrawerItemList {...props} />
        <TouchableOpacity
          onPress={() => router.replace('/protected/dashboard')}
          style={[styles.goHomeButton, { backgroundColor: colors.card }]}
        >
          <Text style={{ color: colors.text }}>Go to Dashboard</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    );
  }

  return (
    <Drawer drawerContent={(props) => <GoHomeButton {...props} />}>
      <Drawer.Screen
        name="index"
        options={{ drawerLabel: 'Home', title: 'Dashboard' }}
        initialParams={{ orgId }}
      />
      <Drawer.Screen
        name="employee"
        options={{ drawerLabel: 'Employees', title: 'Employees' }}
        initialParams={{ orgId }}
      />
      <Drawer.Screen
        name="createSchedule"
        options={{ drawerLabel: 'Create Schedule', title: 'Create a Schedule' }}
        initialParams={{ orgId }}
      />
      <Drawer.Screen
        name="pendingEmployee"
        options={{ drawerLabel: 'Pending Employee List', title: 'Pending Employees' }}
        initialParams={{ orgId }}
      />
      <Drawer.Screen
        name="scheduleTemp"
        options={{ drawerLabel: 'Schedule Templates', title: 'Templates' }}
        initialParams={{ orgId }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  goHomeButton: {
    padding: 16,
    marginTop: 20,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 16,
  },
});
