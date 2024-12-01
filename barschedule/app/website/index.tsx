import { Link, router, Stack, useNavigation, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, OrgSetUp } from "@/firebaseConfig";


export default function HomeScreen() {
  const { user } = useAuth();
  const [adminOrganizations, setAdminOrganization] = useState<OrgSetUp[]>([]);
  const [memberOrganization, setMemberOrganization] = useState<OrgSetUp[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  //Here we use our useEffect to essentially subscribe and call fetch orgs whenever the page is opened with the current user
  useEffect(() => {
    /**This function fetches the member organizations and the admin organizations */
    const fetchOrgs = async () => {
      //This checks if the user is authenticated
      if (!user) return;
      const userID = user?.uid;
      //We get the references to the database folder holding the organizations
      const organizationReference = collection(db, "Organizations");
      try{
        //we query for the organizations that contain adminIds array and then if the userID is within it
        const adminQuery = query(organizationReference, where("adminIds", "array-contains", userID));
        //The snapshot gets the document that results from our query
        const adminSnapShot = await getDocs(adminQuery);
        //Now we map the id and the data to our variable that uses the OrgSetUp which sets up the data structure
        const adminOrgs = adminSnapShot.docs.map(doc => ({ id: doc.id, ...doc.data()} as OrgSetUp));
        //Now we do the same as above
        const memberQuery = query(organizationReference, where("memberIds", "array-contains", userID));
        const memberSnapShot = await getDocs(memberQuery);
        //Here our only difference is that when we map the data we filter out any organizations where the userID is also in the adminIds section
        const memberOrgs = memberSnapShot.docs
                        .map(doc => ({ id: doc.id, ...doc.data()} as OrgSetUp))
                        .filter(org => !org.adminIds.includes(userID));
        //Now add the variables to their respective array
        setAdminOrganization(adminOrgs);
        setMemberOrganization(memberOrgs);
      }
      catch (error:any){
        console.error("Error Fetching organizations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, [user]);
  //if it is loading show text
  if (loading){
    return <Text>Loading Organizations...</Text>
  }
    return (
      <>
        <View style={styles.container}>
          {/**This is the SideBar */}
          <View style={styles.sidebar}>
            <Text style={styles.sideBarTitle}>Navigation</Text>
            {/*Side bar Button Container goes here */}
            <View style={styles.sidebarButtons}>
              {/**Create a new view for every new button and use the button wrap to put space in between them */}
              <View style={styles.buttonWrap}>
                <Button title="Create Organization" onPress={() => router.push("/website/modals/createOrg")} />
              </View>
            </View>
          </View>
          {/**This is where the maincontent will be generated
           * We use the ScrollView to allow for a scroll view of the organizations
           */}
          <ScrollView style={styles.mainContent}>
          <Text style={styles.heading}>Your Admin Organizations</Text>
          {/**This is where we pull the length of my admin organizations and if it is greater than 0 than we show the organizations that someone is apart of 
           * Then we map the organizations to each card
          */}
          {adminOrganizations.length > 0 ? (
            adminOrganizations.map((org) => (
              <View key={org.id} style={styles.card}>
                <Text style={styles.cardTitle}>{org.name}</Text>
                <Text style={styles.cardDescription}>{org.description}</Text>
                <View style={styles.cardActions}>
                  <Button title="Manage" onPress={() => router.push(`/website/adminOrganization/${org.id}`)}/>
                </View>
              </View>
            ))
          ) : (
            <Text>No Admin Organizations Found</Text>
          )}
          {/**We do the same thing we did above with member organizations */}
          <Text style={styles.heading}>Your Organizations</Text>
          {memberOrganization.length > 0 ? (
            memberOrganization.map((org) => (
              <View key={org.id} style={styles.card}>
                <Text style={styles.cardTitle}>{org.name}</Text>
                <Text style={styles.cardDescription}>{org.description}</Text>
                <View style={styles.cardActions}>
                <Button title="View Organization" onPress={() => router.push(`/website/memberOrganizations/${org.id}`)}/>
                </View>
              </View>
            ))
          ) : (
            <Text>No Organizations Found</Text>
          )}
        </ScrollView>
      </View>
        
      </>
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
   