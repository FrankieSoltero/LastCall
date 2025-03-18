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
// MAKE SURE YOU IMPORT THESE TWO OR ELSE it wont work
import DropDownPicker from "react-native-dropdown-picker";
//datetime picker i had to run npx expo run:ios in order for it to work. nothing else worked 
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "@/AuthContext";
import { db } from "@/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

//ideally this is in the employee section and is already set
//Fake Dataset for testing
const employees = [
  { id: 1, name: "Alice", role: "Bartender" },
  { id: 2, name: "Bob", role: "Barback" },
  { id: 3, name: "Charlie", role: "Bartender" },
  { id: 4, name: "Dana", role: "Security" },
  { id: 5, name: "Eve", role: "Barback" },
  { id: 6, name: "Frank", role: "Bartender" },
];

//"ROLES"
const allRoles = ["Bartender", "Barback", "Security", "Manager", "Door"];

//type Definitions
type Shift = {
  startTime: string;
  endTime: string;
  employeeId: number | null;
};

type RoleSchedule = {
  role: string;
  shifts: Shift[];
};

//Helper to format a date as "YYYY-MM-DD" in local time. in all my files i think just so dates are consistent
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DaySchedule() {
  //Extract URL parameters for ORGid startweek and day make sure they are strings
  const params = useLocalSearchParams() as { orgId: string | string[]; date: string | string[]; weekStart: string | string[] };
  const orgId: string = Array.isArray(params.orgId) ? params.orgId[0] : params.orgId;
  const dateStr: string = Array.isArray(params.date) ? params.date[0] : params.date;
  const weekStart: string = Array.isArray(params.weekStart) ? params.weekStart[0] : params.weekStart;

  //ititialize date variables based on start date
  const selectedDate = new Date(dateStr);
  const formattedDate = selectedDate.toDateString();
  const dayOfWeek = selectedDate.toLocaleDateString("en-US", { weekday: "long" });

  //Get the current user
  const { user } = useAuth();

  //UI state for roles and shifts
  //control dropdown for roles
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  //store new role to be added
  const [newRole, setNewRole] = useState<string | null>(null);
  //store the days schedule
  const [daySchedule, setDaySchedule] = useState<RoleSchedule[]>([]);
  //employee dropdown visibility
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);

  //these two are for the time pickers 
  //Start time modal state
  const [isStartTimePickerVisible, setIsStartTimePickerVisible] = useState(false);
  const [activeShiftForStart, setActiveShiftForStart] = useState<{ role: string; shiftIndex: number } | null>(null);
  const [tempStartTime, setTempStartTime] = useState(new Date());

  //end time modal state
  const [isEndTimeModalVisible, setIsEndTimeModalVisible] = useState(false);
  const [activeShiftForEnd, setActiveShiftForEnd] = useState<{ role: string; shiftIndex: number } | null>(null);
  const [tempEndTime, setTempEndTime] = useState<Date>(new Date());

  //fetch the saved day's schedule from Firestore when the component mounts.
  //This ensures that if data was previously saved, it will be loaded.
  //SO manager can click in and out of day schedule even if they are not finished with it and data will show up
  React.useEffect(() => {
    const fetchDaySchedule = async () => {
      const dayKey = formatLocalDate(selectedDate); //format date as key use helper

      //IMPORTANT
      //doc id based on orgid and start date
      const docId = `${orgId}_${weekStart}`;
      try {
        const docRef = doc(db, "Organizations", orgId, "weekSchedules", docId);   //reference the firstore document
        const docSnap = await getDoc(docRef);

        //ge tthe saved day schedule we already made this in create schedule
        if (docSnap.exists() && docSnap.data().days && docSnap.data().days[dayKey]) {
          const dayData = docSnap.data().days[dayKey]; //set the state with the saved schedule
          //Assume that dayData.roles is what you want to set as daySchedule
          setDaySchedule(dayData.roles || []);
        } else {
          //If there's no saved data, ensure the state is empty
          setDaySchedule([]);
        }
      } catch (error) {
        console.error("Error fetching day schedule:", error);    //if error
        Alert.alert("Error", "Failed to load day schedule.");
      }
    };
    fetchDaySchedule();
  }, [orgId, weekStart, dateStr]); //dependency array ensures this runs on parameter change


  //functions to add roles and shifts
  //bc first the manager chooses which role they want to schedule first then within that they add shifts for that role
  const addRoleSchedule = () => {
    if (!newRole) return;
    if (!daySchedule.some((rs) => rs.role === newRole)) {
      setDaySchedule((prev) => [...prev, { role: newRole, shifts: [] }]);
    }
    setNewRole(null); //reset role after adding
  };

  //once chose role, add shift for that role
  const addShift = (role: string) => {
    setDaySchedule((prev) =>
      prev.map((rs) =>
        rs.role === role  //find role that matches the parameter passed role (like you need to be the correct role to shop up in dropdown)
          ? { ...rs, shifts: [...rs.shifts, { startTime: "", endTime: "", employeeId: null }] }
          : rs //if role doesnt match then leave unchanged
      )
    );
  };

  //Update a shift's data (start time, end time, or employee assignment)
  const updateShift = (
    role: string,  //role of the shift (eg bartender)
    shiftIndex: number,  //index of shift in roles shift array
    field: "startTime" | "endTime" | "employeeId",   //field to be updated
    value: string | number | null //new value to be set for field
  ) => {
    setDaySchedule((prev) =>
      prev.map((rs) => {
        if (rs.role === role) {  //find role passed as parameter
          const newShifts = [...rs.shifts]; // Create a copy of the current shifts array to ensure immutability
          newShifts[shiftIndex] = { ...newShifts[shiftIndex], [field]: value }; //update the shift at the specified index //keep existing shifts other data bc obviously will be multiple shifts
          return { ...rs, shifts: newShifts }; //return updated role object
        }
        return rs; //if role doesnt match nada
      })
    );
  };

  //if you want to remove a shift
  const removeShift = (role: string, shiftIndex: number) => {
    setDaySchedule((prev) =>
      prev.map((rs) => {
        if (rs.role === role) {
          const newShifts = [...rs.shifts]; //copy of the shifts array to avoid mutating the original
          newShifts.splice(shiftIndex, 1); //remove the shift at the specified index
          return { ...rs, shifts: newShifts }; //return the updated role object with the new shifts array
        }
        return rs;  //if the role does not match, return the role unchanged
      })
    );
  };


  // start Time Modal Handlers
  const handleSaveStartTime = () => {
    if (activeShiftForStart) {
      updateShift(
        activeShiftForStart.role,
        activeShiftForStart.shiftIndex,
        "startTime",
        tempStartTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
    setIsStartTimePickerVisible(false); //close picker after save
    setActiveShiftForStart(null); //reset active shift
  };


  // end Time Modal Handlers 
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

  //Set a default call end time
  //in my mind if someone is supposed to be on call, then that can just be listed as their endtime. 
  //if im on call starting at 2pm, then my start time is 2pm and my end time is CALL
  const handleSetCallEndTime = () => {
    if (activeShiftForEnd) {
      updateShift(activeShiftForEnd.role, activeShiftForEnd.shiftIndex, "endTime", "CALL");
    }
    setIsEndTimeModalVisible(false);
    setActiveShiftForEnd(null);
  };

  //similar to call end tim ebut for close
  //if shift just goes to close the that will be listed end time
  const handleSetCloseEndTime = () => {
    if (activeShiftForEnd) {
      updateShift(activeShiftForEnd.role, activeShiftForEnd.shiftIndex, "endTime", "CLOSE");
    }
    setIsEndTimeModalVisible(false);
    setActiveShiftForEnd(null);
  };


  //Save schedule function. Manager needs to press this button in order for data to save to firestore
  //need to press in order for them to be able to click out and into day and what they edited to persisit
  //save function: updates the existing week schedule document with this day's data
  const saveSchedule = async () => {
    if (!orgId || !weekStart) {
      Alert.alert("Error", "Missing organization ID or week start.");
      return;
    }
    try {
      //Use local date formatting for the day key
      const dayKey = formatLocalDate(selectedDate);
      //Build the document ID using orgId and the weekStart (manager-chosen)
      const docId = `${orgId}_${weekStart}`;
      
      //Use setDoc with merge: true so that we update the existing document rather than overwrite it
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
      Alert.alert("Success", "Day schedule published successfully!");  //works
    } catch (error: any) {
      console.error("Error publishing schedule:", error);  //error 
      Alert.alert("Error", "Failed to publish schedule.");
    }
  };

  // Rendering UI
  //router hook to naviagte 
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

{/* This could be too wordy */}
      <TouchableOpacity onPress={saveSchedule} style={styles.publishButton}>
        <Text style={styles.publishButtonText}>Save Schedule Must Press In Order for Changes to Save</Text>
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


//styles
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
    marginBottom: 15, //spacing between shifts
  },
  employeeDropdownContainer: {
    marginTop: 8, //spacing between the time pickers row and the dropdown
  }
}); 