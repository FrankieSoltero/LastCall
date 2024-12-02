import { Link, router, Stack, useGlobalSearchParams, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";
import { arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db, OrgSetUp, RouteParams, Employee } from "@/firebaseConfig";
import { RouteProp, useRoute } from "@react-navigation/native";
import { AiOutlineBars } from "react-icons/ai";
import { MaterialIcons } from "@expo/vector-icons";

export default function pendingEmployee() {
    const { user } = useAuth();
    const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
    const orgId = route.params?.orgId as string;
    const navigation = useNavigation();
    const [orgData, setOrgData] = useState<OrgSetUp | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

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
                    const data = { id: orgId, ...orgDoc.data() } as OrgSetUp;
                    //if the data exists then continue with setting the data with the useState
                    if (data) {
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
    //Our loading if statement
    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />
    }
    //Will comment over this when I get the pending employee subcollection sorted out - frankie
    const renderPendingEmployees = ({ item }: { item: Employee }) => {
        return (
            <View style={styles.row}>
                <Text style={styles.cell}>{item.FirstName + " " + item.LastName}</Text>
                <Text style={styles.cell}>{item.email}</Text>
                <View style={styles.cell}>
                    <Button title={"Approve Employee"} onPress={() => console.log("Balls")} />
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    containder: {
        padding: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
    },
    row: {
        flexDirection: "row",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        alignItems: "center"
    },
    cell: {
        flex: 1,
        padding: 8,
    },
    footer: {
        marginTop: 16,
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: "#ccc"
    },
    addButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#0007bff",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    footerText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#007bff"
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)"
    },
    modalContent: {
        width: "80%",
        backgroundColor: "white",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#007bff",
        marginVertical: 10
    },
    modalCode: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#007bff",
        marginVertical: 16,
    },
    modalInstructions: {
        fontSize: 16,
        textAlign: "center",
        marginVertical: 10,
        color: "#555"
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        width: "100%"
    },
    button: {
        flex: 1,
        backgroundColor: "#007bff",
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 5,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    }
})