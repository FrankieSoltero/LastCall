import { Link, router, Stack, useGlobalSearchParams, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db, OrgSetUp, RouteParams } from "@/firebaseConfig";
import { RouteProp, useRoute } from "@react-navigation/native";
import { AiOutlineBars } from "react-icons/ai";
import { MaterialIcons } from "@expo/vector-icons";


export default function DashBoard() {
  //We define useRoute to take a RouteProp and definded the RouteParams to be in the same set up as the on imported
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  //Now we can pull the orgId if params is not null
  const orgId = route.params?.orgId as string;
  //Now we use our orgSet up interface to be able to map the data to an asynchronus function
  const [orgData, setOrgData] = useState<OrgSetUp | null>(null);
  //Loading variable
  const [loading, setLoading] = useState(true);
  //We pull user data here
  const { user } = useAuth();

  //We verify the user is logged in here
  if (!user) {
    return;
  }
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
      //Use a try catch to do all the database actions
      try {
        //We use firebase's doc function to pull the orgReference 
        const organizationReference = doc(db, "Organizations", orgId);
        //We use firebases get doc function to get the orgDocument with the reference
        const orgDoc = await getDoc(organizationReference);
        //If it exists then proceed with assigning the data
        if (orgDoc.exists()) {
          //We add the id to the data incase we need it, and interpret it as orgsetup
          const data = { id: orgId, ...orgDoc.data()} as OrgSetUp;
          //if the data exists then continue with setting the data with the useState
          if (data){
            setOrgData(data as OrgSetUp);
          }
          //Warn the console
          else {
            console.warn("Organization data is empty");
          }
        }
        //Doc doesnt exist if it goes tot he else
        else {
          console.warn("Organization doesn't exist");
        }
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
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/website/adminOrganization/${orgId}/employee`)}>
        <MaterialIcons name="people" size={40} color="black"/>
        <Text style={styles.cardText}>Employees</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/website/adminOrganization/${orgId}/createSchedule`)}>
        <MaterialIcons name="schedule" size={40} color="black"/>
        <Text style={styles.cardText}>Create Schedule Template</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/website/adminOrganization/${orgId}/scheduleTemp`)}>
        <MaterialIcons name="calendar-month" size={40} color="black"/>
        <Text style={styles.cardText}>Schedule Templates</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/website/adminOrganization/${orgId}/pendingEmployee`)}>
        <MaterialIcons name="person-4" size={40} color="black"/>
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
    width: "45%",
    height: 150,
    backgroundColor: "#f8f8f8",
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
