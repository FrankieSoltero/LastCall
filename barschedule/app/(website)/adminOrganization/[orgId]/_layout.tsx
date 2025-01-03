import { Stack, Slot, useRouter, router, useNavigation, Href } from "expo-router";
import { AuthProvider, useAuth } from "@/AuthContext";
import { useEffect, useState } from "react";
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View, Text } from "react-native";
import React from "react";
import { AiOutlineBars } from "react-icons/ai";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { RouteParams } from "@/constants/DataSetUps";

//You absolutely need an index in every folder including tabs it can be renamed through styling

export default function RootLayout() {
  //We use this to determine when the side bar is open
  const [openSideBar, setOpenSideBar] = useState(false);
  //next two variables are explained in the index file
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const orgID = route.params?.orgId as string;
  //We use this function to toggle the side bar
  const toggleSideBar = () => {
    setOpenSideBar(!openSideBar);
  }
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleSideBar}>
          <Ionicons name="menu" size={24} color={openSideBar ? "#111d3e" : "#d4f4b3"} />
      </TouchableOpacity>
      {/**Side Bar */}
      {openSideBar && (
        <>
          <View style={styles.sideBar}>
            <TouchableOpacity style={styles.toggleButton} onPress={toggleSideBar}>
              <Ionicons name="menu" size={24} color="#111d3e" />
              <TouchableOpacity onPress={() => router.replace("/(website)/dashboard")}>
                <View style={styles.iconWithText}>
                  <Ionicons style={styles.sideBarLink} name="beer" size={20} />
                  <Text style={styles.sideBarLink}>Home</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/(website)/adminOrganization/${orgID}` as Href<string>)}>
                <View style={styles.iconWithText}>
                  <Ionicons style={styles.sideBarLink} name="beer" size={20} />
                  <Text style={styles.sideBarLink}>Dashboard</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/(website)/adminOrganization/${orgID}/scheduleTemp` as Href<string>)}>
                <View style={styles.iconWithText}>
                  <Ionicons style={styles.sideBarLink} name="beer" size={20} />
                  <Text style={styles.sideBarLink}>Schedule Templates</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/(website)/adminOrganization/${orgID}/createSchedule` as Href<string>)}>
                <View style={styles.iconWithText}>
                  <Ionicons style={styles.sideBarLink} name="beer" size={20} />
                  <Text style={styles.sideBarLink}>Create Schedule</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/(website)/adminOrganization/${orgID}/employee` as Href<string>)}>
                <View style={styles.iconWithText}>
                  <Ionicons style={styles.sideBarLink} name="beer" size={20} />
                  <Text style={styles.sideBarLink}>Employees</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/(website)/adminOrganization/${orgID}/pendingEmployee` as Href<string>)}>
                <View style={styles.iconWithText}>
                  <Ionicons style={styles.sideBarLink} name="beer" size={20} />
                  <Text style={styles.sideBarLink}>Pending Employees</Text>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </>
      )}
      <View style={[styles.mainContent, openSideBar && { marginLeft: 200 }]}>
          <Slot />
      </View>
    </View>
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
