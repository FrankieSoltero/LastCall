import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { getDocs, collection, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/AuthContext";

export default function MyShifts() {
  const { user } = useAuth();
// State to store the user's shifts, grouped by day
  const [myShifts, setMyShifts] = useState<{ [day: string]: any[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //fetch like pulished schedules
    const fetchMyShifts = async () => {
      if (!user) return;

      try {
        //get user's org ID from Users collection
        const userSnap = await getDoc(doc(db, "Users", user.uid));
        const userData = userSnap.exists() ? userSnap.data() : null;
        const employeeOrgIds = userData?.employeeOrgIds;
        const orgId = employeeOrgIds?.[0] || null;

        if (!orgId) return;

        //get published weekSchedules
        const scheduleSnap = await getDocs(collection(db, "Organizations", orgId, "weekSchedules"));
        const shiftsByDay: { [day: string]: any[] } = {};

        for (const docSnap of scheduleSnap.docs) {
          const data = docSnap.data();
          if (!data.publishedAt || !data.days) continue; // skip unpublished

          const days = data.days as Record<string, any>;
        //loop through the days and roles to find the employees shifts
          for (const [day, dayData] of Object.entries(days)) {
            for (const roleBlock of dayData.roles || []) {
              for (const shift of roleBlock.shifts || []) {
                //if the shift belongs to the current user, add it to the result
                if (shift.employeeId === user.uid) {
                  if (!shiftsByDay[day]) shiftsByDay[day] = [];
                  shiftsByDay[day].push({
                    role: roleBlock.role,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                  });
                }
              }
            }
          }
        }
        //the filtered shifts in state
        setMyShifts(shiftsByDay);
      } catch (error) {
        console.error("Error fetching shifts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyShifts();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  //render
  //def can improve this but for now it shows the dates and shift you have of the published schedules
  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>My Shifts</Text>
          {Object.keys(myShifts).length === 0 ? (
            <Text style={styles.noShifts}>You don’t have any scheduled shifts yet.</Text>
          ) : (
            Object.entries(myShifts)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([day, shifts]) => (
                <View key={day} style={styles.dayBlock}>
                  <Text style={styles.dayTitle}>{day}</Text>
                  {shifts.map((shift, idx) => (
                    <Text key={idx} style={styles.shiftText}>
                      {shift.role}: {shift.startTime} - {shift.endTime}
                    </Text>
                  ))}
                </View>
              ))
          )}
        </ScrollView>
      )}
    </View>
  );
  
}
//styles
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#111d3e",
      },
  container: {
    backgroundColor: "#111d3e",
    padding: 20,
    paddingBottom: 100,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111d3e",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#d4f4b3",
    textAlign: "center",
    marginBottom: 20,
  },
  noShifts: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  dayBlock: {
    backgroundColor: "#1f2a48",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  shiftText: {
    fontSize: 16,
    color: "#d0f0ff",
  },
});
