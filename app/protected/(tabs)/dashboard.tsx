import { Href, router, useRouter } from "expo-router";
import { Text, View, StyleSheet, FlatList, Dimensions, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useAuth } from "@/AuthContext";
import { collectionGroup, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import React from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { OrgSetUp } from "@/constants/DataSetUps";
import { useThemeColors } from "@/hooks/useThemeColors";

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const [orgLoading, setOrgLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrgSetUp[]>([]);
  const colors = useThemeColors();
  const router = useRouter();

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
        const employeeQuery = query(
          collectionGroup(db, "Employees"),
          where("userId", "==", user.uid)
        );
        const employeeSnapShot = await getDocs(employeeQuery);
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
        ).then((orgs) => orgs.filter((org) => org !== null) as OrgSetUp[]);
        setOrganizations(orgData ?? []);
      } catch (error: any) {
        console.error("Error loading dashboard data: ", error);
      } finally {
        setOrgLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  //if it is loading show text
  if (loading) return <Text style={{ color: colors.text }}>User Loading...</Text>;
  if (!user) return router.replace('/');
  if (orgLoading) return <ActivityIndicator size="large" color={colors.text} />;

  const render = ({ item }: { item: OrgSetUp }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => {
        if (item.role === "admin" || item.role === "Owner") {
          router.push(`/protected/adminOrganization/${item.id}`);
        } else {
          router.push(`/protected/memberOrganizations/${item.id}`);
        }
      }}
    >
      <MaterialIcons name="workspaces-outline" size={40} color={colors.text} />
      <Text style={[styles.orgName, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.orgDescription, { color: colors.text }]}>{item.description}</Text>
      <Text style={[styles.roleText, { color: colors.text }]}>{item.role}</Text>
      {/**Here we check if the user is an admin or owner of the organization*/}
      <Text style={[styles.buttonText, { color: colors.text }]}>
        {item.role === "admin" || item.role === "Owner" ? "Manage Organization" : "View Organization"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={organizations}
        keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
        numColumns={2}
        renderItem={render}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  listContainer: {
    alignItems: "center",
  },
  card: {
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
    textAlign: "center",
    marginBottom: 8,
  },
  orgDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  buttonText: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: "bold",
  },
});
