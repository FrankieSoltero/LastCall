import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator, TextInput, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useLocalSearchParams } from 'expo-router';
import { useThemeColors } from '@/app/hooks/useThemeColors';

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

export default function DashBoard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [theme, setTheme] = useState<string>('light'); // Track the theme manually
  const params = useLocalSearchParams();
  const orgId = params.orgId as unknown as string;

  const colors = useThemeColors(); // Get colors based on the system theme (will be overridden manually)

  // Fetch employees from Firestore
  const fetchEmployees = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const employeeReference = collection(db, "Organizations", orgId, "Employees");
      const employeeSnapShot = await getDocs(employeeReference);
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

  useEffect(() => {
    fetchEmployees();
  }, [orgId]);

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handlePromoteToAdmin = async () => {
    if (!selectedEmployee) {
      Alert.alert("Select Employee", "Please select an employee to promote.");
      return;
    }
    const emp = employees.find(emp => emp.id === selectedEmployee);
    const empName = emp ? `${emp.firstName} ${emp.lastName}` : '';
    
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
              await updateDoc(employeeRef, { role: "admin" });
              Alert.alert("Success", `${empName} has been promoted to admin.`);
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
              await deleteDoc(doc(db, "Organizations", orgId));
              Alert.alert("Deleted", "Organization has been deleted.");
            } catch (error) {
              console.error("Error deleting organization:", error);
              Alert.alert("Error", "Failed to delete organization.");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  // Toggle the theme manually
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Admin Settings</Text>

      <Text style={[styles.sectionHeader, { color: colors.text }]}>Promote Employee to Admin</Text>
      <TextInput
        style={[styles.searchInput, { borderColor: colors.text }]}
        placeholder="Search employees..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
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

      <View style={styles.divider} />

      {/* Toggle between light and dark mode */}
      <Text style={{ color: colors.text }}>Switch Theme</Text>
      <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    marginBottom: 10,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  picker: {
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
});
