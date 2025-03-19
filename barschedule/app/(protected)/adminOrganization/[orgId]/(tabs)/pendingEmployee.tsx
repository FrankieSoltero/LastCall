import { Link, router, Stack, useGlobalSearchParams, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";
import { arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { RouteProp, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { Employee, RouteParams } from "@/constants/DataSetUps";


export default function pendingEmployee() {
    /**
     * User is our current user
     * route is our routes parameters grathered using RouteProp and our RouteParams interface
     * OrgId is gathered from route params
     * Navigation is used to disable the header
     * Loading is used to be able to indicate when the data is loading in useEffect
     * pendingEmployee array is an array of pending employees
     */
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const orgId = params.orgId as unknown as string;
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [pendingEmployee, setPendingEmployees] = useState<Employee[]>([]);
    //Check is the user is validated
    if (!user) {
        router.replace("/");
        return;
    }
    //disable the header
    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    //We use the useEffect here so it loads on every interaction with the website
    useEffect(() => {
        //Create an organization fetcher that pulls data everytime the page is loaded
        const fetchPendingEmployees = async () => {
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
                const pendingEmployeeReference = collection(db, "Organizations", orgId, "PendingEmployees");
                const pendingEmployeeSnapShot = await getDocs(pendingEmployeeReference);
                const pendingEmployeesData = pendingEmployeeSnapShot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as unknown as Employee));
                setPendingEmployees(pendingEmployeesData);
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
        fetchPendingEmployees();
    }, [pendingEmployee]);
    //Our loading if statement
    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />
    }
    /**
     * Our first step is to get the reference to the pending employee reference and then we get the document and grab the data from the document
     * We hen get the organizations reference in order to create a new document for our pending employee. Once we create the doc we get the doc
     * to make sure it doesn't exist so there are no duplicate employees. Next we set the doc with the employee reference that way the employees
     * id is the reference to the doc. Then we get the orgData to put into the users user collection data and then finally we delete the pending 
     * employee document
     * @param userId the users id to approve the right user
     * @returns deletes the employee from the pending employee sub collection and adds them to the employee collection
     */
    const approveEmployee = async (userId: string) => {
        try {
            const pendEmployeeRef = doc(db, "Organizations", orgId, "PendingEmployees", userId);
            const pendEmployeeDoc = await getDoc(pendEmployeeRef);
            if (!pendEmployeeDoc.exists()) {
                console.log("Error employee doc does not exist");
                return;
            }
            const pendEmployeeData = pendEmployeeDoc.data();
            const orgRef = doc(db, "Organizations", orgId);
            const pendEmployeeName = pendEmployeeData.FirstName + " " + pendEmployeeData.LastName;
            const employeeRef = doc(orgRef, "Employees", userId);
            const employeeDoc = await getDoc(employeeRef);
            if (employeeDoc.exists()){
                console.log("Employee already Exists");
                return;
            }
            await setDoc(employeeRef, {
                name: pendEmployeeName,
                email: pendEmployeeData.email,
                userId: userId,
                role: "Employee"
            });
            const orgDoc = await getDoc(orgRef);
            if (!orgDoc.exists()){
                console.log("Org Doc does not exist");
                return;
            }
            const userRef = doc(db, "Users", userId);
            await updateDoc(userRef, {
                employeeOrgs: arrayUnion(orgDoc.data().name),
                employeeOrgIds: arrayUnion(orgId)
            });
            await deleteDoc(pendEmployeeRef);
        }
        catch (error: any) {
            console.log("Error: ", error);
        }
    }
    /**
     * This function deletes the user from the pending employee collection. We get the employee reference and then delete the doc
     * and remove them from the pendingEmployee array
     * @param userId The users Id
     */
    const denyEmployee = async (userId: string) => {
        try {
            const employeeRef = doc(db, "Organizations", orgId, "PendingEmployees", userId);
            await deleteDoc(employeeRef);
            Alert.alert("Employee Denied");
            pendingEmployee.filter((Employee) => userId !== Employee.userId);
        }
        catch (error: any){
            console.log("Error Denying Employee: ", error);
        }
    }

    //Will comment over this when I get the pending employee subcollection sorted out - frankie
    const renderPendingEmployees = ({ item }: { item: Employee }) => {
        const date = item.requestedAt;
        return (
            <View style={styles.employeeCard}>
                <Text style={styles.employeeName}>{item.FirstName + " " + item.LastName}</Text>
                <Text style={styles.employeeName}>{"Date Requested: " + date?.toDate()}</Text>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => approveEmployee(item.userId)}>
                        <MaterialIcons name="check" size={40} color="green" />
                        <Text style={styles.buttonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => denyEmployee(item.userId)}>
                        <MaterialIcons name="block" size={40} color="red" />
                        <Text style={styles.buttonText}>Deny</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
    return (
        <View style={styles.containder}>
            <FlatList
                data={pendingEmployee}
                keyExtractor={(item) => item.userId}
                renderItem={renderPendingEmployees}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    containder: {
        padding: 16,
    },
    employeeCard: {
        backgroundColor: "#d4f4b3",
        padding: 16,
        marginBottom: 16,
        borderRadius: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    employeeName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111d3e"
    },
    buttonContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        marginHorizontal: 8,
    },
    buttonText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#111d3e"
    }
})
