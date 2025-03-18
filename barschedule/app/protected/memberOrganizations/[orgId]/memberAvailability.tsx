import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

const MemberAvailability: React.FC = () => {
  // Get orgId and weekStart from URL parameters
  const { orgId, weekStart } = useLocalSearchParams() as { orgId: string; weekStart: string };
  const [availabilityDeadline, setAvailabilityDeadline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeekSchedule = async () => {
      if (!orgId || !weekStart) {
        Alert.alert("Error", "Organization ID or week start not provided.");
        setLoading(false);
        return;
      }
      // Construct the document ID from orgId and the manager-chosen weekStart
      const docId = `${orgId}_${weekStart}`;
      try {
        const docRef = doc(db, "Organizations", orgId, "weekSchedules", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.availabilityDeadline) {
            // Format the deadline nicely (adjust as needed)
            const deadlineDate = new Date(data.availabilityDeadline);
            setAvailabilityDeadline(deadlineDate.toLocaleString());
          } else {
            setAvailabilityDeadline(null);
          }
        } else {
          Alert.alert("No Schedule Found", "No week schedule found for this week.");
        }
      } catch (error) {
        console.error("Error fetching week schedule: ", error);
        Alert.alert("Error", "Failed to fetch schedule.");
      } finally {
        setLoading(false);
      }
    };

    fetchWeekSchedule();
  }, [orgId, weekStart]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {availabilityDeadline ? (
        <Text style={styles.deadlineText}>
          Please submit your availability by {availabilityDeadline}
        </Text>
      ) : (
        <Text style={styles.deadlineText}>No availability deadline found.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#111d3e", 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  deadlineText: { 
    color: "#fff", 
    fontSize: 18, 
    textAlign: "center", 
    padding: 20 
  },
});

export default MemberAvailability;
