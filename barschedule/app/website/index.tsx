import { Link, router, Stack, useNavigation } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";


export default function HomeScreen(): JSX.Element {
  const { user, loading } = useAuth();
  const [organizations, setOrgs] = useState<any[]>([]);

    return (
        <View style={styles.container}>
          {/**This is the SideBar */}
            <View style={styles.sidebar}>
              <Text style={styles.sideBarTitle}>Navigation</Text>
              {/*Side bar Button Container goes here */}
              <View style={styles.sidebarButtons}>
                {/**Create a new view for every new button and use the button wrap to put space in between them */}
                <View style={styles.buttonWrap}>
                  <Button title="Create Organization" onPress={() => router.push("/website/modals/createOrg")}/>
                </View>
                <View style={styles.buttonWrap}>
                  <Button title="Join Organization" onPress={() => router.push("/website/organizationJoin")}/>
                </View>
              </View>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
      flexDirection:"row",
      flex:1,
    },
    sidebar: {
      width:"20%",
      backgroundColor:"#f8f8f8",
      padding:16,
      borderRightWidth: 1,
      borderRightColor: "#ddd",
    },
    sideBarTitle: {
      fontSize:18,
      fontWeight: "bold",
      marginBottom: 20,
    },
    sidebarButtons: {
      flex: 1,
      justifyContent: "flex-start",
      paddingVertical: 10,
    },
    buttonWrap: {
      marginVertical: 10,
    },
    mainContent: {
      flex:1,
      padding: 16,
    },
    heading: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
    },
    card: {
      backgroundColor: "#fff",
      padding: 16,
      marginBottom: 16,
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height:2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "bold"
    },
    cardDescription: {
      marginVertical: 10,
      color: "#666",
    },
    cardActions: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });
   