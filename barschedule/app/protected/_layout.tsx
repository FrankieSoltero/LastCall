import { useRouter, Redirect, Slot } from "expo-router";
import { useAuth } from "@/AuthContext";
import { useEffect, useState } from "react";
import { Text, StyleSheet, View, TouchableOpacity, Dimensions, Platform } from "react-native";
import React from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { prepareUIRegistry } from "react-native-reanimated/lib/typescript/reanimated2/frameCallback/FrameCallbackRegistryUI";
import { GestureHandlerRootView } from "react-native-gesture-handler";
//You absolutely need an index in every folder including tabs it can be renamed through styling

export default function RootLayout() {
  const {user, loading} = useAuth();
  const [isOpen, setOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  //We use this to determine when the side bar is open
  const [openSideBar, setOpenSideBar] = useState(false);
  //We use this function to toggle the side bar
  const toggleSideBar = () => {
    setOpenSideBar(!openSideBar);
  }
  if (loading){
    return <Text>Loading...</Text>;
  }
  if (!user) return <Redirect href="/"/>;
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()){
          console.log("User Doc does not exist");
        }
        const userData = userDoc.data();
        const name = userData?.FirstName + " " + userData?.LastName;
        setUserName(name);
      }
      catch (error: any) {
        console.error(error);
      }
    }
    fetchUserData()
  }, [user]);
    return (
      <GestureHandlerRootView>
        <Slot/>
      </GestureHandlerRootView>
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
  