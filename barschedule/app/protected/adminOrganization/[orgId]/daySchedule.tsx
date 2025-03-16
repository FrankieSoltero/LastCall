import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import { useAuth } from "@/AuthContext";
import { db } from "@/firebaseConfig";
import { doc, updateDoc, setDoc } from "firebase/firestore";

// ---- Fake Datasets ---- //
const employees = [
  { id: 1, name: "Alice", role: "Bartender" },
  { id: 2, name: "Bob", role: "Barback" },
  { id: 3, name: "Charlie", role: "Bartender" },
  { id: 4, name: "Dana", role: "Security" },
  { id: 5, name: "Eve", role: "Barback" },
  { id: 6, name: "Frank", role: "Bartender" },
];

const allRoles = ["Bartender", "Barback", "Security", "Manager", "Door"];

// ---- Type Definitions ---- //
type Shift = {
  startTime: string;
  endTime: string;
  employeeId: number | null;
};

type RoleSchedule = {
  role: string;
  shifts: Shift[];
};

// Helper function to compute the week start 
const getWeekStart = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 1 : d.getDate() - (day - 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
};

export default function DaySchedule() {
  // ----- Get URL parameters (day and orgId) -----
  const { date, orgId } = useLocalSearchParams();
  const selectedDate = date ? new Date(date as string) : new Date();
  const formattedDate = selectedDate.toDateString();
  const dayOfWeek = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
  
  // ----- Auth -----
  const { user } = useAuth();

  // ----- UI State -----
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [newRole, setNewRole] = useState<string | null>(null);
  const [daySchedule, setDaySchedule] = useState<RoleSchedule[]>([]);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);

  // Functions for adding roles, shifts, etc.
  const addRoleSchedule = () => {
    if (!newRole) return;
    if (!daySchedule.some((rs) => rs.role === newRole)) {
      setDaySchedule((prev) => [...prev, { role: newRole, shifts: [] }]);
    }
    setNewRole(null);
  };

  const addShift = (role: string) => {
    setDaySchedule((prev) =>
      prev.map((rs) =>
        rs.role === role
          ? { ...rs, shifts: [...rs.shifts, { startTime: "", endTime: "", employeeId: null }] }
          : rs
      )
    );
  };

  const updateShift = (
    role: string,
    shiftIndex: number,
    field: "startTime" | "endTime" | "employeeId",
    value: string | number
  ) => {
    setDaySchedule((prev) =>
      prev.map((rs) => {
        if (rs.role === role) {
          const newShifts = [...rs.shifts];
          newShifts[shiftIndex] = { ...newShifts[shiftIndex], [field]: value };
          return { ...rs, shifts: newShifts };
        }
        return rs;
      })
    );
  };

  const removeShift = (role: string, shiftIndex: number) => {
    setDaySchedule((prev) =>
      prev.map((rs) => {
        if (rs.role === role) {
          const newShifts = [...rs.shifts];
          newShifts.splice(shiftIndex, 1);
          return { ...rs, shifts: newShifts };
        }
        return rs;
      })
    );
  };

  // ----- Publish the day's schedule to Firestore -----
  const publishSchedule = async () => {
    if (!orgId) {
      Alert.alert("Error", "Organization ID not provided.");
      return;
    }
    try {
      const weekStart = getWeekStart(selectedDate);
      const docId = `${orgId}_${weekStart}`;
      const dayKey = selectedDate.toISOString().slice(0, 10);
      // Use setDoc with merge: true to update or create the document
      await setDoc(
        doc(db, "Organizations", orgId as string, "weekSchedules", docId),
        {
          [`days.${dayKey}`]: {
            roles: daySchedule,
            publishedAt: new Date().toISOString(),
            publishedBy: user ? user.uid : null,
          },
        },
        { merge: true }
      );
      Alert.alert("Success", "Day schedule published successfully!");
    } catch (error) {
      console.error("Error publishing schedule:", error);
      Alert.alert("Error", "Failed to publish schedule.");
    }
  };
  

  // ----- Rendering the UI -----
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{dayOfWeek}, {formattedDate}</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
      <Text style={styles.label}>Add a New Role to This Day:</Text>
      <DropDownPicker
        open={roleDropdownOpen}
        value={newRole}
        items={allRoles.map((r) => ({ label: r, value: r }))}
        setOpen={setRoleDropdownOpen}
        setValue={setNewRole}
        placeholder="Select a Role"
        style={styles.dropdown}
        dropDownContainerStyle={{ backgroundColor: "#333" }}
        textStyle={{ color: "#fff" }}
      />
      <TouchableOpacity onPress={addRoleSchedule} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add Role</Text>
      </TouchableOpacity>

      {/* Render all roles and their shifts */}
      {daySchedule.map((rs) => (
        <View key={rs.role} style={styles.roleSection}>
          <Text style={styles.roleTitle}>{rs.role}</Text>
          <TouchableOpacity onPress={() => addShift(rs.role)} style={styles.shiftButton}>
            <Text style={styles.shiftButtonText}>+ Add Shift</Text>
          </TouchableOpacity>
          {rs.shifts.map((shift, shiftIndex) => {
            const employeesForThisRole = employees.filter((emp) => emp.role === rs.role);
            const selectedEmployee = employeesForThisRole.find((emp) => emp.id === shift.employeeId);
            return (
              <View key={shiftIndex} style={styles.shiftRow}>
                <TextInput
                  style={styles.timeInput}
                  placeholder="Start Time"
                  placeholderTextColor="#aaa"
                  value={shift.startTime}
                  onChangeText={(text) => updateShift(rs.role, shiftIndex, "startTime", text)}
                />
                <TextInput
                  style={styles.timeInput}
                  placeholder="End Time"
                  placeholderTextColor="#aaa"
                  value={shift.endTime}
                  onChangeText={(text) => updateShift(rs.role, shiftIndex, "endTime", text)}
                />
                <DropDownPicker
                  open={employeeDropdownOpen}
                  value={shift.employeeId}
                  items={employeesForThisRole.map((emp) => ({ label: emp.name, value: emp.id }))}
                  setOpen={setEmployeeDropdownOpen}
                  setValue={(val) => {
                    const actualValue = typeof val === "function" ? val(shift.employeeId) : val;
                    updateShift(rs.role, shiftIndex, "employeeId", actualValue);
                  }}
                  placeholder={selectedEmployee ? selectedEmployee.name : "Select Employee"}
                  style={styles.dropdownSmall}
                  dropDownContainerStyle={{ backgroundColor: "#333" }}
                  textStyle={{ color: "#fff" }}
                />
                <TouchableOpacity onPress={() => removeShift(rs.role, shiftIndex)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}

      <TouchableOpacity onPress={publishSchedule} style={styles.publishButton}>
        <Text style={styles.publishButtonText}>Save Schedule</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111d3e", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  backButton: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  label: { color: "#fff", marginBottom: 5, fontWeight: "600" },
  dropdown: { marginBottom: 10, backgroundColor: "#333", borderColor: "#666" },
  addButton: { backgroundColor: "#28a745", padding: 10, borderRadius: 5, marginBottom: 20 },
  addButtonText: { color: "#fff", textAlign: "center" },
  roleSection: { marginBottom: 20, backgroundColor: "#222", padding: 10, borderRadius: 5 },
  roleTitle: { fontSize: 18, fontWeight: "bold", color: "#f8f9fa", marginBottom: 10 },
  shiftButton: { backgroundColor: "#007bff", padding: 8, borderRadius: 5, marginBottom: 10, alignSelf: "flex-start" },
  shiftButtonText: { color: "#fff", textAlign: "center" },
  shiftRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  timeInput: { backgroundColor: "#333", color: "#fff", padding: 10, borderRadius: 5, marginRight: 10, width: 80 },
  dropdownSmall: { width: 120, marginRight: 10, backgroundColor: "#333", borderColor: "#666" },
  removeButton: { backgroundColor: "#dc3545", padding: 8, borderRadius: 5 },
  removeButtonText: { color: "#fff", fontWeight: "bold" },
  publishButton: { backgroundColor: "#28a745", padding: 12, borderRadius: 5, marginTop: 20 },
  publishButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});

//export default DaySchedule;