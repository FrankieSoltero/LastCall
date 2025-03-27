import { Dimensions, Platform, StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { Drawer } from 'expo-router/drawer'
import { useRouter } from "expo-router";
import { DrawerItem } from "@react-navigation/drawer";

//You absolutely need an index in every folder including tabs it can be renamed through styling
export default function RootLayout() {
  const router = useRouter()
  return (
    <Drawer>
      <Drawer.Screen name="index" options={{drawerLabel: 'Home', title: 'Dashboard'}}/>
      <Drawer.Screen name="employee" options={{drawerLabel: 'Employees', title: 'Employees'}}/>
      <Drawer.Screen name="createSchedule" options={{drawerLabel: 'Create Schedule', title: 'Create a Schedule'}}/>
      <Drawer.Screen name="pendingEmployee" options={{drawerLabel: 'Pending Employee List', title: 'Pending Employees'}}/>
      <Drawer.Screen name="scheduleTemp" options={{drawerLabel: 'Schedule Templates', title:'Templates'}}/>
    </Drawer>
  )
}