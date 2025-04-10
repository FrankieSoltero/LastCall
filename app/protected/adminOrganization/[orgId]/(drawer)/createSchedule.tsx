import { useThemeColors } from "@/hooks/useThemeColors";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, Href, useRouter } from "expo-router";
import DatePicker from "react-native-date-picker";
import { db } from "@/firebaseConfig";
import { doc, setDoc, collection } from "firebase/firestore";

const CreateSchedule: React.FC = () => {
  const router = useRouter();
  const { orgId } = useLocalSearchParams();
  const orgIdString = Array.isArray(orgId) ? orgId[0] : orgId;
  const colors = useThemeColors();

  const [numDays, setNumDays] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const [schedule, setSchedule] = useState<Date[]>([]);

  const handleDateConfirm = (selectedDate: Date) => {
    setStartDate(selectedDate);
    setOpen(false);
  };

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const generateWeekSchedule = async () => {
    if (numDays && startDate && orgId) {
      const newSchedule: Date[] = [];
      const daysData: { [key: string]: any } = {};
      let currentDate = new Date(startDate);

      for (let i = 0; i < numDays; i++) {
        const day = new Date(currentDate);
        newSchedule.push(day);
        const dayKey = formatLocalDate(day);
        daysData[dayKey] = { roles: [] };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setSchedule(newSchedule);

      const weekStartFormatted = formatLocalDate(startDate);
      const docId = `${orgId}_${weekStartFormatted}`;

      const availabilityDeadline = new Date(startDate);
      availabilityDeadline.setDate(availabilityDeadline.getDate() - 2);
      const availabilityDeadlineFormatted = formatLocalDate(availabilityDeadline);

      try {
        const weekScheduleRef = doc(
          collection(db, "Organizations", orgIdString, "weekSchedules"),
          docId
        );
        await setDoc(
          weekScheduleRef,
          {
            orgId,
            weekStart: weekStartFormatted,
            availabilityDeadline: availabilityDeadlineFormatted,
            days: daysData,
            generatedAt: new Date().toISOString(),
          },
          { merge: false }
        );

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Create Schedule</Text>

      {!numDays && (
        <>
          <Text style={[styles.label, { color: colors.text }]}>
            Enter how many days the schedule should last:
          </Text>
          <TextInput
            placeholder="Number of Days"
            placeholderTextColor={colors.placeholderText}
            keyboardType="numeric"
            onChangeText={(text) => setNumDays(parseInt(text) || null)}
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.borderColor,
                color: colors.text,
              },
            ]}
          />
        </>
      )}

      {numDays && !startDate && (
        <>
          <TouchableOpacity onPress={() => setOpen(true)} style={[styles.button, { backgroundColor: colors.buttonBackground }]}>
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>Select Start Date</Text>
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
        <Text style={[styles.selectedDate, { color: colors.text }]}>
          Selected Start Date: {startDate.toDateString()}
        </Text>
      )}

      {startDate && numDays && (
        <TouchableOpacity
          onPress={generateWeekSchedule}
          style={[styles.button, { backgroundColor: "#28a745", marginTop: 10 }]}
        >
          <Text style={styles.buttonText}>Generate Week Schedule</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() =>
          router.push(
            `/protected/adminOrganization/${orgIdString}/weekSchedule?weekStart=${startDate ? formatLocalDate(startDate) : ""}` as Href
          )
        }
        style={[styles.viewSchedulesButton, { backgroundColor: colors.buttonBackground }]}
      >
        <Text style={[styles.viewSchedulesButtonText, { color: colors.buttonText }]}>
          View & Edit This Week Schedule
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push(
            `/protected/adminOrganization/${orgId}/scheduleTemp?weekStart=${startDate ? formatLocalDate(startDate) : ""}` as Href
          )
        }
        style={[styles.viewSchedulesButton, { backgroundColor: colors.buttonBackground }]}
      >
        <Text style={[styles.viewSchedulesButtonText, { color: colors.buttonText }]}>
          View & Edit All Schedules
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  selectedDate: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: "center",
  },
  viewSchedulesButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  viewSchedulesButtonText: {
    textAlign: "center",
    fontWeight: "600",
  },
});

export default CreateSchedule;
