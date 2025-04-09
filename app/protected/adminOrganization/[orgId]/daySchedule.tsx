// app/protected/adminOrganization/[orgId]/daySchedule.tsx

import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Calendar } from "react-native-calendars";
import { useThemeColors } from "@/hooks/useThemeColors";

//This screen displays the Day Schedule in the calendar view
//Allows the user to select a specific day and see that it's highlighted
export default function DayScheduleScreen() {
  const colors = useThemeColors();
  const [selectedDate, setSelectedDate] = useState("");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Select a Day</Text>
      <Calendar
        current={new Date().toISOString().split("T")[0]}
        onDayPress={(day) => {
          //Sets the selected date when user taps a day
          setSelectedDate(day.dateString);
          console.log("Selected day:", day);
        }}
        markedDates={{
          //Marks the selected day with color and dot
          [selectedDate]: {
            selected: true,
            marked: true,
            selectedColor: colors.tint || "blue",
          },
        }}
        theme={{
          calendarBackground: colors.background,
          textSectionTitleColor: colors.text,
          dayTextColor: colors.text,
          monthTextColor: colors.text,
          todayTextColor: colors.tint,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
});
