import { AuthProvider, useAuth } from "@/AuthContext";
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, Href, useRouter } from "expo-router";
import DatePicker from "react-native-date-picker";
import { db } from "@/firebaseConfig";
import { doc, setDoc, collection } from "firebase/firestore";

const CreateSchedule: React.FC = () => {
  const router = useRouter();
  const { orgId } = useLocalSearchParams();
  const [numDays, setNumDays] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const [schedule, setSchedule] = useState<Date[]>([]);
  const orgIdString = Array.isArray(orgId) ? orgId[0] : orgId;

  const handleDateConfirm = (selectedDate: Date) => {
    setStartDate(selectedDate);
    setOpen(false);
  };
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  
  

  // This function generates the week schedule and saves it to Firestore as a subcollection under Organizations/{orgId}/weekSchedules
  const generateWeekSchedule = async () => {
    if (numDays && startDate && orgId) {
      const newSchedule: Date[] = [];
      const daysData: { [key: string]: any } = {};
      let currentDate = new Date(startDate);


      for (let i = 0; i < numDays; i++) {
        const day = new Date(currentDate);
        newSchedule.push(day);
        const dayKey = formatLocalDate(day); // e.g., "2025-03-27"
        daysData[dayKey] = { roles: [] }; // This sets up the "days" object correctly.
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setSchedule(newSchedule);

      // Use startDate as the week start (YYYY-MM-DD)
      const weekStartFormatted = formatLocalDate(startDate);
      const docId = `${orgId}_${weekStartFormatted}`;

      const availabilityDeadline = new Date(startDate);
      availabilityDeadline.setDate(availabilityDeadline.getDate() - 1);
      const availabilityDeadlineFormatted = formatLocalDate(availabilityDeadline);


      try {
        // Create a reference to the subcollection "weekSchedules" under Organizations/{orgId}
        const weekScheduleRef = doc(collection(db, "Organizations", orgIdString, "weekSchedules"), docId);
        await setDoc(weekScheduleRef, {
          orgId,
          weekStart: weekStartFormatted,
          availabilityDeadline: availabilityDeadlineFormatted,
          days: daysData,
          generatedAt: new Date().toISOString(),
        }, { merge: false });
        Alert.alert("Success", "Week schedule generated and saved!");
      } catch (error: any) {
        console.error("Error generating week schedule:", error);
        Alert.alert("Error", "Failed to generate week schedule.");
      }
    } else {
      Alert.alert("Missing Data", "Please enter the number of days and select a start date.");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10, color: "white" }}>
        Create Schedule
      </Text>

      {!numDays && (
        <>
          <Text style={{ color: "white" }}>Enter how many days the schedule should last:</Text>
          <TextInput
            placeholder="Number of Days"
            placeholderTextColor="white"
            keyboardType="numeric"
            onChangeText={(text) => setNumDays(parseInt(text) || null)}
            style={styles.input}
          />
        </>
      )}

      {numDays && !startDate && (
        <>
          <TouchableOpacity onPress={() => setOpen(true)} style={styles.button}>
            <Text style={styles.buttonText}>Select Start Date</Text>
          </TouchableOpacity>
          {open && (
            <DatePicker
              date={startDate || new Date()}
              onDateChange={handleDateConfirm}
              mode="date"
              open={open}
              onConfirm={handleDateConfirm}
              onCancel={() => setOpen(false)}
              modal={true}
            />
          )}
        </>
      )}

      {startDate && (
        <Text style={{ marginTop: 10, color: "white" }}>
          Selected Start Date: {startDate.toDateString()}
        </Text>
      )}

      {startDate && numDays && (
        <TouchableOpacity onPress={generateWeekSchedule} style={[styles.button, styles.greenButton]}>
          <Text style={styles.buttonText}>Generate Week Schedule</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => router.push(
          `/protected/adminOrganization/${orgIdString}/weekSchedule?weekStart=${startDate ? formatLocalDate(startDate) : ""}` as Href
        )}
        style={styles.viewSchedulesButton}
      >
        <Text style={styles.viewSchedulesButtonText}>View & Edit This Week Schedule</Text>
      </TouchableOpacity>


      {schedule.length > 0 && (
        <ScrollView horizontal style={styles.scheduleContainer}>
          {schedule.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={styles.scheduleDate}
              onPress={() =>
                router.push(
                  `/protected/adminOrganization/${orgId}/daySchedule?date=${formatLocalDate(date)}&weekStart=${startDate ? formatLocalDate(startDate) : ""}` as Href
                )
              }
            >
              <Text>{date.toDateString()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <TouchableOpacity
      onPress={() => router.push(
        `/protected/adminOrganization/${orgId}/scheduleTemp?weekStart=${startDate ? formatLocalDate(startDate) : ""}` as Href
      )}
        style={styles.viewSchedulesButton}
      >
        <Text style={styles.viewSchedulesButtonText}>View & Edit All Schedules</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
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
  viewSchedulesButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  viewSchedulesButtonText: {
    color: "white",
    textAlign: "center",
  },  
  input: { borderWidth: 1, padding: 8, marginBottom: 10 },
  button: { marginBottom: 10, padding: 10, backgroundColor: "#007bff", borderRadius: 5 },
  greenButton: { backgroundColor: "#28a745", marginTop: 20 },
  buttonText: { color: "white", textAlign: "center" },
  scheduleContainer: { marginTop: 20, flexDirection: "row", paddingBottom: 20 },
  scheduleDate: {
    marginRight: 10,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 5,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CreateSchedule;
