import { Link, router, Stack, useGlobalSearchParams, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";
import { arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db, OrgSetUp, RouteParams, Employee } from "@/firebaseConfig";
import { RouteProp, useRoute } from "@react-navigation/native";
import { AiOutlineBars } from "react-icons/ai";
import { MaterialIcons } from "@expo/vector-icons";


//Fake employee list
const employees: Employee[] = [
    { FirstName: "Alex", LastName: "Berry", email: "alex@example.com", employeeID: "1" },
    { FirstName: "Tobias", LastName: "Johnson", email: "tobias@example.com", employeeID: "2" }
]

export default function employeeView() {
    //We use the same use Route described in index
    const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
    const orgId = route.params?.orgId as string;
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
    //We use use effect to turn off the header
    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);
    //We use this render employees function to show the employess in a cell like manner
    const renderEmployees = ({ item }: { item: Employee }) => {
        return (
            <View style={styles.row}>
                <Text style={styles.cell}>{item.FirstName + " " + item.LastName}</Text>
                <Text style={styles.cell}>{item.email}</Text>
                <View style={styles.cell}>
                    <Button title={item.role || "Assign Role"} onPress={() => console.log("Balls")} />
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
        //We use navigators clipborad function to copy the link for the user
        await navigator.clipboard.writeText(inviteCode);
        setCopied(true);
    }
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
            await updateDoc(orgReference, { inviteLinks: activeInviteLinks});
            //if the length of the valid invite links is 0 generate a new one
            if (activeInviteLinks.length == 0){
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
    const renderListFooter = () => {
        return (
            <View style={styles.row}>
                <View style={styles.cell} />
                <View style={styles.cell} />
                <View style={styles.cell}>
                    <Button title="Generate Invite Link" onPress={handleEmployeeInvite} />
                </View>
            </View>
        )
    }
    return (
        <View style={styles.containder}>
            <Text style={styles.header}>Employees</Text>
            <FlatList
                data={employees}
                renderItem={renderEmployees}
                keyExtractor={(item) => item.employeeID}
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
                        <Text style={styles.modalContent}>{inviteCode}</Text>
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
        </View>
    )
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