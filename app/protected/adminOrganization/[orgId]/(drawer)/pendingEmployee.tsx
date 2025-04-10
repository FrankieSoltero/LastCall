import { Href, router, useLocalSearchParams } from "expo-router";
import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useAuth } from "@/AuthContext";
import { db } from "@/firebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import { Employee } from "@/constants/DataSetUps";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function pendingEmployee() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const orgId = params.orgId as unknown as string;
  const [loading, setLoading] = useState(false);
  const [pendingEmployee, setPendingEmployees] = useState<Employee[]>([]);
  const colors = useThemeColors();

  if (!user) {
    router.replace("/");
    return;
  }

  useEffect(() => {
    const fetchPendingEmployees = async () => {
      if (!orgId || !db) return;
      try {
        const pendingEmployeeReference = collection(db, "Organizations", orgId, "PendingEmployees");
        const pendingEmployeeSnapShot = await getDocs(pendingEmployeeReference);
        const pendingEmployeesData = pendingEmployeeSnapShot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as unknown as Employee));
        setPendingEmployees(pendingEmployeesData);
      } catch (error: any) {
        console.log("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingEmployees();
  }, [orgId]);

  if (loading) {
    return <ActivityIndicator size="large" color={colors.tint} />;
  }

  const approveEmployee = async (userId: string) => {
    try {
      const pendEmployeeRef = doc(db, "Organizations", orgId, "PendingEmployees", userId);
      const pendEmployeeDoc = await getDoc(pendEmployeeRef);
      if (!pendEmployeeDoc.exists()) return;
      const pendEmployeeData = pendEmployeeDoc.data();
      const pendEmployeeName = pendEmployeeData.FirstName + " " + pendEmployeeData.LastName;

      const employeeRef = doc(db, "Organizations", orgId, "Employees", userId);
      const employeeDoc = await getDoc(employeeRef);
      if (employeeDoc.exists()) return;

      await updateDoc(doc(db, "Users", userId), {
        employeeOrgs: arrayUnion(orgId),
        employeeOrgIds: arrayUnion(orgId),
      });

      await updateDoc(employeeRef, {
        name: pendEmployeeName,
        email: pendEmployeeData.email,
        userId: userId,
        role: "Employee",
      });

      await deleteDoc(pendEmployeeRef);
    } catch (error: any) {
      console.log("Error:", error);
    }
  };

  const denyEmployee = async (userId: string) => {
    try {
      const employeeRef = doc(db, "Organizations", orgId, "PendingEmployees", userId);
      await deleteDoc(employeeRef);
      Alert.alert("Employee Denied");
      setPendingEmployees(prev => prev.filter(e => e.userId !== userId));
    } catch (error: any) {
      console.log("Error Denying Employee:", error);
    }
  };

  const renderPendingEmployees = ({ item }: { item: Employee }) => {
    const dateText = item.requestedAt?.toDate().toLocaleString() ?? "N/A";

    return (
      <View style={[styles.employeeCard, { backgroundColor: colors.card }]}>
        <View>
          <Text style={[styles.employeeName, { color: colors.text }]}>
            {item.FirstName + " " + item.LastName}
          </Text>
          <Text style={[styles.employeeName, { color: colors.text }]}>
            Date Requested: {dateText}
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={() => approveEmployee(item.userId)}>
            <MaterialIcons name="check" size={40} color="green" />
            <Text style={[styles.buttonText, { color: colors.text }]}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => denyEmployee(item.userId)}>
            <MaterialIcons name="block" size={40} color="red" />
            <Text style={[styles.buttonText, { color: colors.text }]}>Deny</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={pendingEmployee}
        keyExtractor={(item) => item.userId}
        renderItem={renderPendingEmployees}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  employeeCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    marginTop: 4,
  },
});
