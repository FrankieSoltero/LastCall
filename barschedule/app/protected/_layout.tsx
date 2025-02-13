import { useRouter, Redirect, Slot } from "expo-router";
import { useAuth } from "@/AuthContext";
import { useEffect, useState } from "react";
import { Text, StyleSheet, View, TouchableOpacity, Dimensions, Platform } from "react-native";
import React from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
//You absolutely need an index in every folder including tabs it can be renamed through styling

export default function RootLayout() {
  const {user, loading} = useAuth();
  const [isOpen, setOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const OS = Platform.OS;
  //We use this to determine when the side bar is open
  const [openSideBar, setOpenSideBar] = useState(false);
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return <Redirect href="/"/>;
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
  //We use this function to toggle the side bar
  const toggleSideBar = () => {
    setOpenSideBar(!openSideBar);
  }
  if (loading){
    if (!user) return <Redirect href={"/"}/>;
    return <Text>Loading...</Text>;
  }
    return (
      <Slot/>
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
  