import { Href, Link, router, Stack, useNavigation, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";
import { collection, collectionGroup, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import React from "react";
import { GestureHandlerRootView, TouchableOpacity } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { OrgSetUp } from "@/constants/DataSetUps";
const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const [orgLoading, setOrgLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrgSetUp[]>([]);
  const router = useRouter();
  if (loading) return <Text>Loading User...</Text>;
  //Here we use our useEffect to essentially subscribe and call fetch orgs whenever the page is opened with the current user
  useEffect(() => {
    /**
     * We first gather the reference to all the organizations that the user is apart of. Once we have the employee snapshot we then use the Promie.all
     * function to wait until the following code is done for all the documents in the snapshot. Then we gather the orgId and the orgDoc and add the orgData
     * as an orgSetUp interface and add the item to the organizations array where each organization can be access along with all its data. We finally set the 
     * orgLoading variable to false. 
     * @returns Returns the organizations the user is apart of
     */
    const fetchDashboardData = async () => {
      try {
        if (!user) return;
        console.log("Step 1");
        const employeeQuery = query(
          collectionGroup(db, "Employees"),
          where("userId", "==", user.uid)
        );
        console.log("Step 2");
        const employeeSnapShot = await getDocs(employeeQuery);
        console.log("Step 3");
        const orgData = await Promise.all(
          employeeSnapShot.docs.map(async (docSnapshot) => {
            const orgId = docSnapshot.ref.parent.parent?.id;
            if (orgId == null) return;
            const orgRef = doc(db, "Organizations", orgId)
            const orgDoc = await getDoc(orgRef);
            const role = docSnapshot.data().role;
            if (orgDoc.exists()) {
              const data = { id: orgId, ...orgDoc.data(), role: role } as OrgSetUp;
              return data;
            }
            return null;
          })
        ).then((orgs) => orgs.filter((org) => org !== null) as unknown as OrgSetUp[]);
        setOrganizations(orgData ?? []);
      } catch (error: any) {
        console.error("Error loading dashboard data: ", error);
      } finally {
        setOrgLoading(false);
      }
    };
    fetchDashboardData();
  }, [organizations]);
  //if it is loading show text
  if (orgLoading) return <Text>Organizations Loading...</Text>;
  const render = ({item} : {item:OrgSetUp}) => {
    return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (item.role === "admin" || item.role === "Owner"){
          console.log(`/protected/adminOrganization/${item.id}`)
          router.push(`/(protected)/adminOrganization/${item.id}`);        
        }
        else {
          router.push(`/(protected)/memberOrganizations/${item.id}`);
        }
      }}
      >
        <MaterialIcons name="workspaces-outline" size={40} color="#111d3e"/>
        <Text style={styles.orgName}>{item.name}</Text>
        <Text style={styles.orgDescritpion}>{item.description}</Text>
        <Text style={styles.roleText}>{item.role}</Text>
        {/**Here we check if the user is an admin or owner of the organization*/}
        {item.role === "admin" || item.role === "Owner" ? (
          <Text style={styles.buttonText}>Manage Organization</Text>
        ) : (
          <Text style={styles.buttonText}>View Organization</Text>
        )}
      </TouchableOpacity>
    );
  }
  //here we render the footer that redirects to create org
  const renderFooter = () => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/(protected)/modals/createOrg")}>
          <MaterialIcons name="create" size={40} color="#111d3e" />
          <Text style={styles.orgName}>Create Organization</Text>
        </TouchableOpacity>
        
    )
  }
  return (
      <View style={styles.container}>
        <FlatList
          data={organizations}
          keyExtractor={(item) => item.id as string}
          numColumns={2}
          renderItem={render}
          contentContainerStyle={styles.listContainer}
          ListFooterComponent={renderFooter}
          />
      </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111d3e",
    padding: 20,
    justifyContent: "center"
  },
  sidebar: {
    width: "10%",
    backgroundColor: "#d4f4b3",
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    height: Dimensions.get("window").height,
  },
  sideBarTitle: {
    fontSize: 18,
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  listContainer: {
    alignItems: "center",
  },
  card: {
    backgroundColor: "#d4f4b3",
    padding: 30,
    margin: 10,
    borderRadius: 16,
    width: screenWidth * 0.42,
    height: 200,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  orgName: {
    fontSize: 18,
    color: "#111d3e",
    textAlign: "center",
    marginBottom: 8,
  },
  orgDescritpion: {
    fontSize: 14,
    color: "#111d3e",
    textAlign: "center",
    marginBottom: 8
  },
  roleText: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#111d3e",
    textAlign: "center"
  },
  buttonText: {
    marginTop: 8,
    fontSize: 8,
    color: "#111d3e",
    fontWeight: "bold"
  }
});
