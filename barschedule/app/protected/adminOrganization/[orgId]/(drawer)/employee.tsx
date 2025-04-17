import { Link, router, Stack, useGlobalSearchParams, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";
import { arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, deleteDoc, setDoc, where } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { RouteProp, useRoute } from "@react-navigation/native";
import { AiOutlineBars, AiTwotoneAudio } from "react-icons/ai";
import { MaterialIcons } from "@expo/vector-icons";
import { Employee, OrgSetUp, RouteParams } from "@/constants/DataSetUps";
import * as Clipboard from 'expo-clipboard';
import { useThemeColors } from '@/app/hooks/useThemeColors'; 
//fix colors




export default function employeeView() {
    //We use the same use Route described in index
    const params = useLocalSearchParams();
    const orgId = params.orgId as unknown as string;
    console.log(orgId);
    //The user variable defined using UseAuth
    const { user } = useAuth();
    //Our invite link variable
    const [inviteCode, setInviteCode] = useState("");
    //We use navigation to set the header to false
    const navigation = useNavigation();
    //We use this to define when the modal should be open
    const [modalVisible, setModalVisible] = useState(false);
    //We use this for our copied text to determine what instructions are given
    const [copied, setCopied] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);


    //state for role creation
    const [createRoleModalVisible, setCreateRoleModalVisible] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");


    //so assign role modal for employees
    const [assignRoleModalVisible, setAssignRoleModalVisible] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    useEffect(() => {
        //Create an organization fetcher that pulls data everytime the page is loaded
        const fetchEmployees = async () => {
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
                /**
                 * Employee Reference gathers the reference to the employees within the organizations sub collection
                 * EmployeeSnapShot gets all the docs within the collection reference
                 * EmployeeData maps each docs data within the snap shot to an employee item and stores them in the asyncronous array
                 */
                const employeeReference = collection(db, "Organizations", orgId, "Employees");
                const employeeSnapShot = await getDocs(employeeReference);
                const employeesData = employeeSnapShot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as unknown as Employee));
                console.log(employeesData);
                setEmployees(employeesData);
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
        fetchEmployees();
    }, [orgId]);
    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />
    }
    /**
     * This function renders our employees within the flatlist
     * @param Employee this is each employee within the employee array
     * @returns the cell style information of each employee with a button to edit an employees givin role and position
     */
    const renderEmployees = ({ item }: { item: Employee }) => {
        return (


            <View style={styles.row}>
                <Text style={styles.cell}>{item.name}</Text>
                <Text style={styles.cell}>{item.email}</Text>
                <View style={styles.cell}>
                    <TouchableOpacity style={styles.button} onPress={() => openRoleAssignModal(item.userId)}>
                        <Text style={styles.buttonText}>Assign Role</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteEmployee(item.userId)}>
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>






        )
    }
    //Our modal closer
    const closeModal = () => {
        setModalVisible(false);
        setCopied(false);
    }
    //The function we have to use because we can't use functions with variables in on press
    const handleEmployeeInvite = () => {
        generateInviteLink(orgId);
    }
    //Our function to handle what happens when we press the copy link
    const handleCopyLink = async () => {
        if (Platform.OS == 'web') {
            //We use navigators clipborad function to copy the link for the user
            await navigator.clipboard.writeText(inviteCode);
        }
        else {
            await Clipboard.setStringAsync(inviteCode);
        }
        setCopied(true);
    }


    //function that pulls roles from Organization/[orgID]/roles that the manager can choose from to assign to employees
    //opens the "Assign Role" modal for a selected employee
    //fetches the available roles from the organization document and pre-selects the employee's current roles
    const openRoleAssignModal = async (userId: string) => {
        //selected employee
        setSelectedEmployeeId(userId);
        // Show the role assignment modal
        setAssignRoleModalVisible(true);


        try {
            // Reference the organization's Firestore document
            const orgRef = doc(db, "Organizations", orgId);
            const orgSnap = await getDoc(orgRef);
            const orgData = orgSnap.data();
            //get the roles array from the organization data (fallback to empty array if not found)
            const roles = orgData?.roles || [];
            //store the roles in state to populate the dropdown
            setAvailableRoles(roles);


            //load existing employee roles
            const employeeRef = doc(db, "Organizations", orgId, "Employees", userId);
            //doc snapshot
            const employeeSnap = await getDoc(employeeRef);
            const employeeData = employeeSnap.data();
            //store the employee's current roles (if any) so they are pre-selected in the modal
            setSelectedRoles(employeeData?.orgRoles || []);
        } catch (error) {
            //this is if error
            console.error("Error loading roles:", error);
            Alert.alert("Error", "Failed to load roles.");
        }
    };


    //this then saves the roles to employees
    //firestore Organization/{orgID}/Employees/{userID}/roles
    const saveAssignedRoles = async () => {
        if (!selectedEmployeeId) return;


        try {
            const employeeRef = doc(db, "Organizations", orgId, "Employees", selectedEmployeeId);
            await updateDoc(employeeRef, {
                orgRoles: selectedRoles,
            });


            Alert.alert("Success", "Roles assigned successfully.");
            setAssignRoleModalVisible(false);
        } catch (error) {
            console.error("Error saving roles:", error);
            Alert.alert("Error", "Failed to save roles.");
        }
    };


    //delete an employee
    //also deletes them from firestore
    const deleteEmployee = async (userId: string) => {
        Alert.alert(
            "Delete Employee",
            //double checks they wanna dleete employee
            "Are you sure you want to remove this employee? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, "Organizations", orgId, "Employees", userId), {
                                deletedAt: new Date().toISOString(),
                            });
                            // OR to fully delete:
                            await deleteDoc(doc(db, "Organizations", orgId, "Employees", userId));

                            setEmployees((prev) => prev.filter((emp) => emp.userId !== userId));
                            Alert.alert("Deleted", "Employee removed successfully.");
                        } catch (error) {
                            console.error("Error deleting employee:", error);
                            Alert.alert("Error", "Failed to delete employee.");
                        }
                    },
                },
            ]
        );
    };





    //create role function to save under field post
    const handleCreateRole = async () => {
        //remove whitespace
        const roleName = newRoleName.trim();

        //role name not mpty
        if (!roleName) {
            Alert.alert("Missing Info", "Please enter a role name.");
            return;
        }
        //get org data
        try {
            const orgRef = doc(db, "Organizations", orgId);
            const orgSnap = await getDoc(orgRef);

            //if nto found
            if (!orgSnap.exists()) {
                Alert.alert("Error", "Organization not found.");
                return;
            }
            //get existing roles
            const orgData = orgSnap.data();
            const existingRoles: string[] = orgData.roles || [];

            //check if role exists
            if (existingRoles.includes(roleName)) {
                Alert.alert("Duplicate Role", "This role already exists.");
                return;
            }
            //add new role to roles array and update firestore
            const updatedRoles = [...existingRoles, roleName];
            await updateDoc(orgRef, { roles: updatedRoles });

            //tell them they created the role or not
            Alert.alert("Success", `Role "${roleName}" created.`);
            setNewRoleName("");
            setCreateRoleModalVisible(false);
        } catch (error: any) {
            //error
            console.error("Error creating role:", error.message);
            Alert.alert("Error", "Failed to create role.");
        }
    };





    //Our function to generate invite links
    const generateInviteLink = async (orgId: string) => {
        //Before deployment link to use to make the invite code
        const beforeDeploymentLink = "http://localhost:8081";
        //We use maths random function to generate a random token
        const Randomtoken = Math.random().toString(36).substring(2, 15) as string;
        try {
            //We pull our reference to the document
            const orgReference = doc(db, "Organizations", orgId);
            //We use get doc to get the document and all its attributes
            const orgDoc = await getDoc(orgReference);
            //If it doesn't exist then an error is returned
            if (!orgDoc.exists()) {
                console.error("Error doc does not exists");
                return null;
            }
            //We pull the data into a variable and define it with our org set up interface
            const data = { id: orgId, ...orgDoc.data() } as OrgSetUp;
            //We pull any invite links into an empty array
            const inviteLinks = data.inviteLinks || [];
            //We pull the date
            const now = new Date();
            //Now we use the filter variable to then set it so only the links that aren't expired are put into this array
            const activeInviteLinks = inviteLinks.filter(
                (link: any) => link.expiresAt.toDate() > now
            );
            //We use firebases update doc to make sure we only have non expired links
            await updateDoc(orgReference, { inviteLinks: activeInviteLinks });
            //if the length of the valid invite links is 0 generate a new one
            if (activeInviteLinks.length == 0) {
                //Use update doc to update the doc and add an inviteLinks attribute
                await updateDoc(orgReference, {
                    inviteLinks: arrayUnion({
                        token: Randomtoken,
                        createdAt: new Date(),
                        expiresAt: new Date(new Date().setDate(new Date().getDate() + 7)),
                    }),
                });
            }
            //Construct the invite link with all our pieces
            const inviteLink = `${beforeDeploymentLink}/invite?orgId=${orgId}&token=${activeInviteLinks.length > 0 ? activeInviteLinks[0].token : Randomtoken
                }`;
            //Set the invite code to be stored for use later
            setInviteCode(inviteLink);
            //Set the modal visible
            setModalVisible(true);
        }
        catch (error: any) {
            console.error("Error Generating invite link: ", error.message);
        }


    }
    //This function renders our footer which is an empty 3 part cell with the invite button attatched
    //i added to this so that next to invite employees there is a create role button which will make a role to be saved to the organization
    //then employees can be assigned that role
    const renderListFooter = () => {
        return (
            <>
                <View style={styles.row}>
                    <View style={styles.cell}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => setCreateRoleModalVisible(true)}
                        >
                            <Text style={styles.buttonText}>Create Role</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.cell}>
                        <TouchableOpacity style={styles.button} onPress={handleEmployeeInvite}>
                            <Text style={styles.buttonText}>Invite Employees</Text>
                        </TouchableOpacity>
                    </View>
                </View>


            </>
        );
    };


    return (
        <View style={styles.container}>
            <Text style={styles.header}>Employees</Text>
            <FlatList
                data={employees}
                renderItem={renderEmployees}
                keyExtractor={(item) => item.userId}
                ListFooterComponent={renderListFooter}
            />
            {/**Invite Code Modal will show up here */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Sharable Invite Link</Text>
                        <Text style={styles.modalTitle}>{inviteCode}</Text>
                        {copied ? <Text style={styles.modalInstructions}>Link Copied</Text> : <Text style={styles.modalInstructions}>
                            Share this code with any employee you wish to. This code will expire in a week from now
                        </Text>}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button} onPress={closeModal}>
                                <Text style={styles.buttonText}>Close</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button} onPress={handleCopyLink}>
                                <Text style={styles.buttonText}>Copy Link</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>



            {/**this is the modal to assign roles. a drop down of roles will popup for each person, and you can click 
             * on button if it applies to that employee. will not change color if you didnt click it
             */}

            <Modal
                animationType="slide"
                transparent={true}
                visible={assignRoleModalVisible}
                onRequestClose={() => setAssignRoleModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Assign Roles</Text>


                        {availableRoles.map((role, index) => (
                            <TouchableOpacity
                                key={index}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginVertical: 6,
                                    backgroundColor: selectedRoles.includes(role) ? "#d4f4b3" : "#222",
                                    padding: 10,
                                    borderRadius: 5,
                                }}
                                onPress={() => {
                                    if (selectedRoles.includes(role)) {
                                        setSelectedRoles(selectedRoles.filter(r => r !== role));
                                    } else {
                                        setSelectedRoles([...selectedRoles, role]);
                                    }
                                }}
                            >
                                <Text style={{ color: selectedRoles.includes(role) ? "#111d3e" : "white" }}>
                                    {role}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {/**makes sure manager wants to save the changes they made to them employee (they actually wanna save that assigned role) */}

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.button} onPress={() => setAssignRoleModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button} onPress={saveAssignedRoles}>
                                <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/**At botom of screen. for create roles. asks them to input role name, and they have to choose whether they want to save that role
 * which will be saved to the organization
 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={createRoleModalVisible}
                onRequestClose={() => setCreateRoleModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create a New Role</Text>
                        <TextInput
                            placeholder="Role Name"
                            placeholderTextColor="#aaa"
                            value={newRoleName}
                            onChangeText={setNewRoleName}
                            style={[styles.input, { marginBottom: 10, color: "white" }]}
                        />
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => setCreateRoleModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button} onPress={handleCreateRole}>
                                <Text style={styles.buttonText}>Save Role</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

//styles

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#111d3e'
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#d4f4b3"
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
        color: "#d4f4b3"
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
        backgroundColor: "#d4f4b3",
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
        backgroundColor: "#111d3e",
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
        color: "#d4f4b3",
        marginVertical: 10
    },
    modalCode: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#d4f4b3",
        marginVertical: 16,
    },
    modalInstructions: {
        fontSize: 16,
        textAlign: "center",
        marginVertical: 10,
        color: "#d4f4b3"
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        width: "100%"
    },
    button: {
        flex: 1,
        backgroundColor: "#d4f4b3",
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 5,
        alignItems: "center",
    },
    buttonText: {
        color: "#111d3e",
        fontWeight: "bold",
        fontSize: 16,
    },
    input: {
        width: "100%",
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        backgroundColor: "#222",
        color: "white",
    },
    deleteButton: {
        backgroundColor: "#dc3545", // red
        padding: 10,
        borderRadius: 5,
        marginTop: 6,
        alignItems: "center",
    },
    deleteButtonText: {
        color: "white",
        fontWeight: "bold",
    }
})
