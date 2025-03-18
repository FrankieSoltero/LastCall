import { useLocalSearchParams } from "expo-router";
import React, { useState , useEffect} from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from '@/AuthContext';
import { db } from '@/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Define the days of the week
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MemberAvailability() {
  const { user } = useAuth();
  
  // availability will hold an object like { Monday: { start: string, end: string }, ... }
  const [availability, setAvailability] = useState<{ [day: string]: { start?: string; end?: string } }>({});
  
  // State for controlling the time picker modal
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<'start' | 'end' | null>(null);
  const [tempTime, setTempTime] = useState(new Date());

  // When a time field is pressed, open the picker and note which day and field to update
  const openTimePicker = (day: string, field: 'start' | 'end') => {
    setActiveDay(day);
    setActiveField(field);
    // Initialize tempTime to either the current value (if exists) or the current time
    if (availability[day] && availability[day][field]) {
      // For simplicity, we set to current time if value exists.
      setTempTime(new Date());
    } else {
      setTempTime(new Date());
    }
    setIsPickerVisible(true);
  };

  // onTimeChange is called by DateTimePicker when a time is selected
  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate && activeDay && activeField) {
      const formattedTime = selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAvailability(prev => ({
        ...prev,
        [activeDay]: {
          ...prev[activeDay],
          [activeField]: formattedTime,
        }
      }));
    }
    setIsPickerVisible(false);
    setActiveDay(null);
    setActiveField(null);
  };

  // Save availability to Firestore under the current user's document
  const handleSaveAvailability = async () => {
    if (!user) {
      Alert.alert("Error", "No user signed in.");
      return;
    }
    try {
      const userDocRef = doc(db, "Users", user.uid);
      await setDoc(userDocRef, { availability }, { merge: true });
      Alert.alert("Success", "Availability saved successfully!");
    } catch (error: any) {
      console.error("Error saving availability:", error);
      Alert.alert("Error", "Failed to save availability.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Your Availability</Text>
      {daysOfWeek.map(day => (
        <View key={day} style={styles.dayRow}>
          <Text style={styles.dayLabel}>{day}</Text>
          <TouchableOpacity style={styles.timeField} onPress={() => openTimePicker(day, 'start')}>
            <Text style={styles.timeText}>
              {availability[day]?.start || "Start Time"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.timeField} onPress={() => openTimePicker(day, 'end')}>
            <Text style={styles.timeText}>
              {availability[day]?.end || "End Time"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveAvailability}>
        <Text style={styles.saveButtonText}>Save Availability</Text>
      </TouchableOpacity>

      {isPickerVisible && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111d3e",
    padding: 16,
    justifyContent: "center"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center"
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15
  },
  dayLabel: {
    color: "#fff",
    fontSize: 18,
    width: 100
  },
  timeField: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    flex: 1,
    alignItems: "center"
  },
  timeText: {
    color: "#fff"
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  }
});

//export default MemberAvailability;