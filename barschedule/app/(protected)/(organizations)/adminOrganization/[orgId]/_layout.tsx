import { Dimensions, Platform, StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { Drawer } from 'expo-router/drawer'
import { useLocalSearchParams, useRouter } from "expo-router";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";

//You absolutely need an index in every folder including tabs it can be renamed through styling
export default function RootLayout() {
  const params = useLocalSearchParams()
  const orgId = params.orgId as unknown as string
  const router = useRouter()

  function GoHomeButton(props: any) {
    return (
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props}/>
        <TouchableOpacity 
          onPress={() => router.replace('/(protected)/dashboard')}
          style={{
            padding: 16,
            marginTop: 20,
            backgroundColor: '#ddd',
            borderRadius: 4,
            alignItems: 'center'
          }}
          >
            <Text>Go to Dashboard</Text>
          </TouchableOpacity>
      </DrawerContentScrollView>
    )
  }
  return (
    <Drawer drawerContent={(props) => <GoHomeButton{...props} />}>
      <Drawer.Screen name="index" options={{drawerLabel: 'Home', title: 'Dashboard'}} initialParams={{ orgId }}/>
      <Drawer.Screen name="employee" options={{drawerLabel: 'Employees', title: 'Employees'}} initialParams={{ orgId }}/>
      <Drawer.Screen name="createSchedule" options={{drawerLabel: 'Create Schedule', title: 'Create a Schedule'}} initialParams={{ orgId }}/>
      <Drawer.Screen name="pendingEmployee" options={{drawerLabel: 'Pending Employee List', title: 'Pending Employees'}} initialParams={{ orgId }}/>
      <Drawer.Screen name="scheduleTemp" options={{drawerLabel: 'Schedule Templates', title:'Templates'}} initialParams={{ orgId }}/>
    </Drawer>
  )
}