import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Modal 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "@/AuthContext";
import { db } from "@/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

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

// Helper to format a date as "YYYY-MM-DD" in local time.
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DaySchedule() {
  // Extract URL parameters and ensure they are strings
  const params = useLocalSearchParams() as { orgId: string | string[]; date: string | string[]; weekStart: string | string[] };
  const orgId: string = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;
  const dateStr: string = Array.isArray(params.date) ? params.date[0] : params.date;
  const weekStart: string = Array.isArray(params.weekStart) ? params.weekStart[0] : params.weekStart;

  // Use the provided date for this day
  const selectedDate = new Date(dateStr);
  const formattedDate = selectedDate.toDateString();
  const dayOfWeek = selectedDate.toLocaleDateString("en-US", { weekday: "long" });

  // Get the current user
  const { user } = useAuth();

  // UI state for roles and shifts
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [newRole, setNewRole] = useState<string | null>(null);
  const [daySchedule, setDaySchedule] = useState<RoleSchedule[]>([]);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);

  //Start time modal
  const [isStartTimePickerVisible, setIsStartTimePickerVisible] = useState(false);
  const [activeShiftForStart, setActiveShiftForStart] = useState<{ role: string; shiftIndex: number } | null>(null);
  const [tempStartTime, setTempStartTime] = useState(new Date());

  // --- CUSTOM END TIME MODAL STATE ---
  const [isEndTimeModalVisible, setIsEndTimeModalVisible] = useState(false);
  const [activeShiftForEnd, setActiveShiftForEnd] = useState<{ role: string; shiftIndex: number } | null>(null);
  const [tempEndTime, setTempEndTime] = useState<Date>(new Date());

  // Fetch the saved day's schedule from Firestore when the component mounts.
  // This ensures that if data was previously saved, it will be loaded.
  React.useEffect(() => {
    const fetchDaySchedule = async () => {
      const dayKey = formatLocalDate(selectedDate);
      const docId = `${orgId}_${weekStart}`;
      try {
        const docRef = doc(db, "Organizations", orgId, "weekSchedules", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().days && docSnap.data().days[dayKey]) {
          const dayData = docSnap.data().days[dayKey];
          // Assume that dayData.roles is what you want to set as daySchedule
          setDaySchedule(dayData.roles || []);
        } else {
          // If there's no saved data, ensure the state is empty
          setDaySchedule([]);
        }
      } catch (error) {
        console.error("Error fetching day schedule:", error);
        Alert.alert("Error", "Failed to load day schedule.");
      }
    };
    fetchDaySchedule();
  }, [orgId, weekStart, dateStr]);


  // Functions to add roles and shifts
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
    value: string | number | null
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


  // --- End Time Modal Handlers ---
  const handleSaveStartTime = () => {
    if (activeShiftForStart) {
      updateShift(
        activeShiftForStart.role,
        activeShiftForStart.shiftIndex,
        "startTime",
        tempStartTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
    setIsStartTimePickerVisible(false);
    setActiveShiftForStart(null);
  };


  // --- End Time Modal Handlers ---
  const handleSaveEndTime = () => {
    if (activeShiftForEnd) {
      updateShift(
        activeShiftForEnd.role,
        activeShiftForEnd.shiftIndex,
        "endTime",
        tempEndTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
    setIsEndTimeModalVisible(false);
    setActiveShiftForEnd(null);
  };

  const handleSetCallEndTime = () => {
    if (activeShiftForEnd) {
      updateShift(activeShiftForEnd.role, activeShiftForEnd.shiftIndex, "endTime", "CALL");
    }
    setIsEndTimeModalVisible(false);
    setActiveShiftForEnd(null);
  };

  const handleSetCloseEndTime = () => {
    if (activeShiftForEnd) {
      updateShift(activeShiftForEnd.role, activeShiftForEnd.shiftIndex, "endTime", "CLOSE");
    }
    setIsEndTimeModalVisible(false);
    setActiveShiftForEnd(null);
  };


  // Publish function: updates the existing week schedule document with this day's data
  const publishSchedule = async () => {
    if (!orgId || !weekStart) {
      Alert.alert("Error", "Missing organization ID or week start.");
      return;
    }
    try {
      // Use local date formatting for the day key
      const dayKey = formatLocalDate(selectedDate);
      // Build the document ID using orgId and the weekStart (manager-chosen)
      const docId = `${orgId}_${weekStart}`;
      
      // Use setDoc with merge: true so that we update the existing document rather than overwrite it
      await setDoc(
        doc(db, "Organizations", orgId, "weekSchedules", docId),
        {
          days: {
            [dayKey]: {
              roles: daySchedule,
              publishedAt: new Date().toISOString(),
              publishedBy: user ? user.uid : null,
            },
          },
        },
        { merge: true }
      );
      Alert.alert("Success", "Day schedule published successfully!");
    } catch (error: any) {
      console.error("Error publishing schedule:", error);
      Alert.alert("Error", "Failed to publish schedule.");
    }
  };

  // Rendering UI
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{dayOfWeek}, {formattedDate}</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      
      {/* Role & Shift Management UI */}
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

      {daySchedule.map((rs) => (
  <View key={rs.role} style={styles.roleSection}>
    <Text style={styles.roleTitle}>{rs.role}</Text>
    <TouchableOpacity onPress={() => addShift(rs.role)} style={styles.shiftButton}>
      <Text style={styles.shiftButtonText}>+ Add Shift</Text>
    </TouchableOpacity>
    {rs.shifts.map((shift, shiftIndex) => {
      const employeesForThisRole = employees.filter(emp => emp.role === rs.role);
      const selectedEmployee = employeesForThisRole.find(emp => emp.id === shift.employeeId);
      return (
        <View key={shiftIndex} style={styles.shiftContainer}>
          <View style={styles.shiftRow}>
            {/* Start Time Picker Trigger */}
            <TouchableOpacity
              style={styles.timeInput}
              onPress={() => {
                setActiveShiftForStart({ role: rs.role, shiftIndex });
                setTempStartTime(new Date());
                setIsStartTimePickerVisible(true);
              }}
            >
              <Text style={{ color: "#fff" }}>
                {shift.startTime || "Select Start Time"}
              </Text>
            </TouchableOpacity>
            
            {/* End Time Picker Trigger */}
            <TouchableOpacity
              style={styles.timeInput}
              onPress={() => {
                setActiveShiftForEnd({ role: rs.role, shiftIndex });
                setTempEndTime(new Date());
                setIsEndTimeModalVisible(true);
              }}
            >
              <Text style={{ color: "#fff" }}>
                {shift.endTime || "Select End Time"}
              </Text>
            </TouchableOpacity>
            
            {/* Remove Shift Button */}
            <TouchableOpacity onPress={() => removeShift(rs.role, shiftIndex)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
          {/* Employee Dropdown Row */}
          <View style={styles.employeeDropdownContainer}>
            <DropDownPicker
              open={employeeDropdownOpen}
              value={shift.employeeId}
              items={employeesForThisRole.map(emp => ({
                label: emp.name,
                value: emp.id,
              }))}
              setOpen={setEmployeeDropdownOpen}
              setValue={(newValue: number | ((prevState: number | null) => number | null)) =>
                updateShift(rs.role, shiftIndex, "employeeId", typeof newValue === "function" ? newValue(shift.employeeId) : newValue)
              }
              placeholder={selectedEmployee ? selectedEmployee.name : "Select Employee"}
              style={styles.dropdownSmall}
              dropDownContainerStyle={{ backgroundColor: "#333" }}
              textStyle={{ color: "#fff" }}
            />
          </View>
        </View>
      );
    })}
  </View>
))}


      <TouchableOpacity onPress={publishSchedule} style={styles.publishButton}>
        <Text style={styles.publishButtonText}>Save Schedule</Text>
      </TouchableOpacity>



      {isStartTimePickerVisible && (
        <Modal
          transparent
          animationType="slide"
          onRequestClose={() => {
            setIsStartTimePickerVisible(false);
            setActiveShiftForStart(null);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Start Time</Text>
              <DateTimePicker
                value={tempStartTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  if (event.type === "set" && selectedTime) {
                    setTempStartTime(selectedTime);
                  }
                }}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={handleSaveStartTime} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Save Time</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsStartTimePickerVisible(false);
                    setActiveShiftForStart(null);
                  }}
                  style={[styles.modalButton, { backgroundColor: "#f44336" }]}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {isEndTimeModalVisible && (
        <Modal
          transparent
          animationType="slide"
          onRequestClose={() => {
            setIsEndTimeModalVisible(false);
            setActiveShiftForEnd(null);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select End Time</Text>
              <DateTimePicker
                value={tempEndTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  if (event.type === "set" && selectedTime) {
                    setTempEndTime(selectedTime);
                  }
                }}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={handleSaveEndTime} style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Save Time</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSetCallEndTime} style={[styles.modalButton, { backgroundColor: "#ff9800" }]}>
                  <Text style={styles.modalButtonText}>CALL</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSetCloseEndTime} style={[styles.modalButton, { backgroundColor: "#f44336" }]}>
                  <Text style={styles.modalButtonText}>CLOSE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};



const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#111d3e", 
    padding: 16 
  },
  dropdownSmall: {
    width: 120,
    backgroundColor: "#333",
    borderColor: "#666"
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#fff", 
    marginBottom: 20 
  },
  backButton: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  backButtonText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
  label: { 
    color: "#fff", 
    marginBottom: 5, 
    fontWeight: "600" 
  },
  dropdown: { 
    marginBottom: 10, 
    backgroundColor: "#333", 
    borderColor: "#666" 
  },
  addButton: { 
    backgroundColor: "#28a745", 
    padding: 10, 
    borderRadius: 5, 
    marginBottom: 20 
  },
  addButtonText: { 
    color: "#fff", 
    textAlign: "center" 
  },
  roleSection: { 
    marginBottom: 20, 
    backgroundColor: "#222", 
    padding: 10, 
    borderRadius: 5 
  },
  roleTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#f8f9fa", 
    marginBottom: 10 
  },
  shiftButton: { 
    backgroundColor: "#007bff", 
    padding: 8, 
    borderRadius: 5, 
    marginBottom: 10, 
    alignSelf: "flex-start" 
  },
  shiftButtonText: { 
    color: "#fff", 
    textAlign: "center" 
  },
  shiftRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 10 
  },
  timeInput: { 
    backgroundColor: "#333", 
    padding: 10, 
    borderRadius: 5, 
    marginRight: 10, 
    width: 120, 
    justifyContent: "center" 
  },
  removeButton: { 
    backgroundColor: "#dc3545", 
    padding: 8, 
    borderRadius: 5 
  },
  removeButtonText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
  publishButton: { 
    backgroundColor: "#28a745", 
    padding: 12, 
    borderRadius: 5, 
    marginTop: 20 
  },
  publishButtonText: { 
    color: "#fff", 
    fontWeight: "bold", 
    textAlign: "center" 
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20
  },
  modalButton: {
    padding: 10,
    backgroundColor: "#28a745",
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center"
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold"
  },
  shiftContainer: {
    marginBottom: 15, // spacing between shifts
  },
  employeeDropdownContainer: {
    marginTop: 8, // spacing between the time pickers row and the dropdown
  }
}); 