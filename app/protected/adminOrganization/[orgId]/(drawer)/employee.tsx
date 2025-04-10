import { Link, router, Stack, useLocalSearchParams, useNavigation } from "expo-router";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  Platform,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import { Employee, OrgSetUp } from "@/constants/DataSetUps";

export default function employeeView() {
  const params = useLocalSearchParams();
  const orgId = params.orgId as unknown as string;
  const { user } = useAuth();
  const navigation = useNavigation();
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [createRoleModalVisible, setCreateRoleModalVisible] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [assignRoleModalVisible, setAssignRoleModalVisible] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!orgId || !db) return;
      try {
        const employeeReference = collection(db, "Organizations", orgId, "Employees");
        const employeeSnapShot = await getDocs(employeeReference);
        const employeesData = employeeSnapShot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as unknown as Employee));
        setEmployees(employeesData);
      } catch (error: any) {
        console.log("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [orgId]);

  const openRoleAssignModal = async (userId: string) => {
    setSelectedEmployeeId(userId);
    setAssignRoleModalVisible(true);
    try {
      const orgRef = doc(db, "Organizations", orgId);
      const orgSnap = await getDoc(orgRef);
      const roles = orgSnap.data()?.roles || [];
      setAvailableRoles(roles);
      const employeeRef = doc(db, "Organizations", orgId, "Employees", userId);
      const employeeSnap = await getDoc(employeeRef);
      setSelectedRoles(employeeSnap.data()?.orgRoles || []);
    } catch (error) {
      console.error("Error loading roles:", error);
      Alert.alert("Error", "Failed to load roles.");
    }
  };

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

  const deleteEmployee = async (userId: string) => {
    Alert.alert("Delete Employee", "Are you sure you want to remove this employee? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "Organizations", orgId, "Employees", userId));
            setEmployees(prev => prev.filter(emp => emp.userId !== userId));
            Alert.alert("Deleted", "Employee removed successfully.");
          } catch (error) {
            console.error("Error deleting employee:", error);
            Alert.alert("Error", "Failed to delete employee.");
          }
        },
      },
    ]);
  };

  const handleCreateRole = async () => {
    const roleName = newRoleName.trim();
    if (!roleName) {
      Alert.alert("Missing Info", "Please enter a role name.");
      return;
    }
    try {
      const orgRef = doc(db, "Organizations", orgId);
      const orgSnap = await getDoc(orgRef);
      const existingRoles: string[] = orgSnap.data()?.roles || [];
      if (existingRoles.includes(roleName)) {
        Alert.alert("Duplicate Role", "This role already exists.");
        return;
      }
      const updatedRoles = [...existingRoles, roleName];
      await updateDoc(orgRef, { roles: updatedRoles });
      Alert.alert("Success", `Role "${roleName}" created.`);
      setNewRoleName("");
      setCreateRoleModalVisible(false);
    } catch (error: any) {
      console.error("Error creating role:", error.message);
      Alert.alert("Error", "Failed to create role.");
    }
  };

  const renderEmployees = ({ item }: { item: Employee }) => (
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
  );

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Employees</Text>
      <FlatList
        data={employees}
        renderItem={renderEmployees}
        keyExtractor={(item) => item.userId}
      />
      {/* Additional modals for assigning roles and creating roles would be defined here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#d4f4b3",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    alignItems: "center",
  },
  cell: {
    flex: 1,
    padding: 8,
    color: "#d4f4b3",
  },
  button: {
    backgroundColor: "#d4f4b3",
    padding: 10,
    borderRadius: 5,
    marginTop: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#111d3e",
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 5,
    marginTop: 6,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});