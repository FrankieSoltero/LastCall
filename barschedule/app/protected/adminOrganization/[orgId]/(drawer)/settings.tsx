import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AdminSettingsProps {
  orgId: string;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ orgId }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // This function fetches employees from Firestore for our organization.
  const fetchEmployees = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      // Get the reference to the Employees subcollection.
      const employeeReference = collection(db, "Organizations", orgId, "Employees");
      const employeeSnapShot = await getDocs(employeeReference);
      // Map the documents to my Employee interface.
      const employeesData = employeeSnapShot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching employees:", error);
      Alert.alert("Error", "Failed to fetch employees.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees when the component mounts or when orgId changes.
  useEffect(() => {
    fetchEmployees();
  }, [orgId]);

  // I filter the employees based on the search term entered.
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // This function promotes a selected employee to admin after a confirmation prompt.
  const handlePromoteToAdmin = async () => {
    if (!selectedEmployee) {
      Alert.alert("Select Employee", "Please select an employee to promote.");
      return;
    }
    // Find the selected employee so we can show their name in the confirmation.
    const emp = employees.find(emp => emp.id === selectedEmployee);
    const empName = emp ? `${emp.firstName} ${emp.lastName}` : '';
    
    // Show a confirmation alert before promoting the employee.
    Alert.alert(
      "Confirm Promotion",
      `Are you sure you want to promote ${empName} to admin?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Promote",
          onPress: async () => {
            try {
              const employeeRef = doc(db, "Organizations", orgId, "Employees", selectedEmployee);
              // Update the employee's role to 'admin'.
              await updateDoc(employeeRef, { role: "admin" });
              Alert.alert("Success", `${empName} has been promoted to admin.`);
              // Refresh the employee list for a real-time UI update.
              await fetchEmployees();
            } catch (error) {
              console.error("Error promoting employee:", error);
              Alert.alert("Error", "Failed to promote employee.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // This function deletes the organization after a confirmation prompt.
  const handleDeleteOrganization = async () => {
    Alert.alert(
      "Delete Organization",
      "Are you sure you want to delete the organization? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete the organization document from Firestore.
              await deleteDoc(doc(db, "Organizations", orgId));
              Alert.alert("Deleted", "Organization has been deleted.");
              // Optionally, add navigation or further UI updates here.
            } catch (error) {
              console.error("Error deleting organization:", error);
              Alert.alert("Error", "Failed to delete organization.");
            }
          }
        }
      ]
    );
  };

  // If the data is still loading, show a spinner.
  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Settings</Text>

      <Text style={styles.sectionHeader}>Promote Employee to Admin</Text>
      {/* Search bar to filter employees by name */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search employees..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      {/* Picker for selecting an employee */}
      <Picker
        selectedValue={selectedEmployee}
        onValueChange={(itemValue) => setSelectedEmployee(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select an employee" value={null} />
        {filteredEmployees.map(emp => (
          <Picker.Item
            key={emp.id}
            label={`${emp.firstName} ${emp.lastName} (${emp.role})`}
            value={emp.id}
          />
        ))}
      </Picker>
      <Button title="Promote to Admin" onPress={handlePromoteToAdmin} />

      <View style={styles.divider} />

      <Button title="Delete Organization" onPress={handleDeleteOrganization} color="red" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center'
  },
  sectionHeader: {
    fontSize: 18,
    marginBottom: 10
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10
  },
  picker: {
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  }
});

export default AdminSettings;
