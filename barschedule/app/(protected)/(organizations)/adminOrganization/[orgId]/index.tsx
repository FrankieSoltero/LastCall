import { Href, Link, router, Stack, useGlobalSearchParams, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { RouteProp, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { OrgSetUp, RouteParams } from "@/constants/DataSetUps";
import React from "react";

export default function DashBoard() {
  //We define useRoute to take a RouteProp and definded the RouteParams to be in the same set up as the on imported
  //Now we can pull the orgId if params is not null
  const params = useLocalSearchParams();
  const orgId = params.orgId as unknown as string;
  //Now we use our orgSet up interface to be able to map the data to an asynchronus function
  const { user } = useAuth();
  const [orgData, setOrgData] = useState<OrgSetUp | null>(null);
  //Loading variable
  const [loading, setLoading] = useState(true);
  console.log(orgId);
  //We use the useEffect here so it loads on every interaction with the website
  useEffect(() => {
    //Create an organization fetcher that pulls data everytime the page is loaded
    const fetchOrgData = async () => {
      //Check if the orgId exists
      if (!orgId) {
        return;
      }
      //Check if the database exists 
      if (!db) {
        return;
      }
      if (!user) {
        return;
      }
      //Use a try catch to do all the database actions
      try {
       const orgRef = doc(db, "Organizations", orgId);
       const orgDoc = await getDoc(orgRef);
       if (!orgDoc.exists()){
        console.log("Org doesn't exist");
        Alert.alert("Organization does not exist");
       }
       const data = orgDoc.data();
      }
      //Catch the error
      catch (error: any) {
        console.log("Error:", error);
      }
      //Set loading to false
      finally {
        setLoading(false);
      }
    };
    fetchOrgData();
  }, [orgId]);
  //If its loading return an activity indicator
  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff"/>
  }
  //if the orgId doesn't exists then the organization is not found
  if (!orgId) {
    return <Text>Organization Not Found</Text>
  }
  return (
    <View style={styles.container}>
      {/**Dashboard Cards */}
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/protected/adminOrganization/${orgId}/employee` as Href)}>
        <MaterialIcons name="people" size={40} color="#111d3e"/>
        <Text style={styles.cardText}>Employees</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/protected/adminOrganization/${orgId}/createSchedule` as Href)}>
        <MaterialIcons name="schedule" size={40} color="#111d3e"/>
        <Text style={styles.cardText}>Create Schedule Template</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/protected/adminOrganization/${orgId}/scheduleTemp` as Href)}>
        <MaterialIcons name="calendar-month" size={40} color="#111d3e"/>
        <Text style={styles.cardText}>Schedule Templates</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/protected/adminOrganization/${orgId}/pendingEmployee` as Href)}>
        <MaterialIcons name="person-4" size={40} color="#111d3e"/>
        <Text style={styles.cardText}>Pending Employees</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flex: 1,
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 16,
  },
  card: {
    width: "30%",
    height: 150,
    backgroundColor: "#d4f4b3",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4},
    shadowRadius: 4,
    elevation: 4,
  },
  mainContent: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 0,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20
  },
  cardText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
});
