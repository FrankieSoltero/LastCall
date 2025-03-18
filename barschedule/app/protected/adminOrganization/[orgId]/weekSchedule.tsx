import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from "react-native";
import { useLocalSearchParams, useRouter, Href } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";


//purpose of this page is a screen that a manager can click into and see a list of the schedules they just generated
//each day is a big button that they can click into to edit that days schedule

//Helper function to format dates in local "YYYY-MM-DD" format.
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const localDateFromString = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  

export default function WeekSchedule() {
  // Extract URL parameters safely. These should be passed when navigating to this screen.
  const params = useLocalSearchParams() as { orgId?: string | string[]; weekStart?: string | string[] };
  const orgId = params.orgId ? (Array.isArray(params.orgId) ? params.orgId[0] : params.orgId) : "";
  const weekStart = params.weekStart ? (Array.isArray(params.weekStart) ? params.weekStart[0] : params.weekStart) : "";
  const router = useRouter();

  const [weekSchedule, setWeekSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  //make sure orID is string
  const orgIdString = Array.isArray(orgId) ? orgId[0] : orgId;


  //get week datat from firestore
  useEffect(() => {
    const fetchWeekSchedule = async () => {
      if (!orgId || !weekStart) {
        Alert.alert("Error", "Missing organization ID or week start.");
        setLoading(false);
        return;
      }
      const docId = `${orgId}_${weekStart}`;
      try {
        //week in firestore containing data
        const docRef = doc(db, "Organizations", orgId, "weekSchedules", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setWeekSchedule(docSnap.data());
        } else {
          Alert.alert("Not Found", "No schedule found for this week.");  //alert if no shcedule is found
        }
      } catch (error) {
        console.error("Error fetching week schedule:", error);
        Alert.alert("Error", "Failed to fetch week schedule.");
      } finally {
        setLoading(false);
      }
    };
    fetchWeekSchedule();
  }, [orgId, weekStart]);

  //loader
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  //Ensure we have a "days" field and then extract keys and sort them.
  //Sort the day keys by date to ensure the days are displayed in chronological order
  let sortedDayKeys: string[] = [];
  if (weekSchedule && weekSchedule.days) {
    const formattedDeadline = weekSchedule.availabilityDeadline
    ? formatLocalDate(new Date(weekSchedule.availabilityDeadline))
    : "";
    sortedDayKeys = Object.keys(weekSchedule.days)
    .filter((key: string) => key !== formattedDeadline)
    .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime()); //ascending order
}


//should be just a list of the different days 
//sometime i am having bug where schedule shifts back a day idk why
//but well deal with that if i see it again
return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Week Schedule: {weekStart}</Text>
      {sortedDayKeys.map((dayKey: string) => {
        const localDate = localDateFromString(dayKey);
        return (
          <TouchableOpacity
            key={dayKey}
            style={styles.dayCard}
            onPress={() =>
              router.push(
                `/protected/adminOrganization/${orgId}/daySchedule?date=${dayKey}&weekStart=${weekStart}` as Href
              )
            }
          >
            <Text style={styles.dayText}>{localDate.toDateString()}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

//styles
const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: "#111d3e", 
    padding: 20, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  title: { 
    fontSize: 24, 
    color: "#fff", 
    fontWeight: "bold", 
    marginBottom: 20, 
    textAlign: "center" 
  },
  dayCard: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    width: "100%",
    alignItems: "center",
  },
  dayText: { 
    color: "#fff", 
    fontSize: 18 
  },
  backButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#28a745",
    borderRadius: 5,
  },
  backButtonText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
});
