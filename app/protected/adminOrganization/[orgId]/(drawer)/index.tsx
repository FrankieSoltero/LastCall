import { Href, Link, router, Stack, useLocalSearchParams } from "expo-router";
import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/AuthContext";
import { db } from "@/firebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import { OrgSetUp } from "@/constants/DataSetUps";
import { useThemeColors } from "@/hooks/useThemeColors";

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
  const colors = useThemeColors();

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
          return;
        }
        const data = orgDoc.data();
        setOrgData(data as OrgSetUp);
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
    return <ActivityIndicator size="large" color={colors.tint}/>;
  }
  //if the orgId doesn't exists then the organization is not found
  if (!orgId) {
    return <Text style={{ color: colors.text }}>Organization Not Found</Text>;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {/**Dashboard Cards */}
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => router.push(`/protected/adminOrganization/${orgId}/employee` as Href)}>
        <MaterialIcons name="people" size={40} color={colors.icon} />
        <Text style={[styles.cardText, { color: colors.text }]}>Employees</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => router.push(`/protected/adminOrganization/${orgId}/createSchedule` as Href)}>
        <MaterialIcons name="schedule" size={40} color={colors.icon} />
        <Text style={[styles.cardText, { color: colors.text }]}>Create Schedule Template</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => router.push(`/protected/adminOrganization/${orgId}/scheduleTemp` as Href)}>
        <MaterialIcons name="calendar-month" size={40} color={colors.icon} />
        <Text style={[styles.cardText, { color: colors.text }]}>Schedule Templates</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => router.push(`/protected/adminOrganization/${orgId}/pendingEmployee` as Href)}>
        <MaterialIcons name="person-4" size={40} color={colors.icon} />
        <Text style={[styles.cardText, { color: colors.text }]}>Pending Employees</Text>
      </TouchableOpacity>
    </View>
  );
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
    width: "40%",
    height: 150,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 4,
  },
  cardText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
});
