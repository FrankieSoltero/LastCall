import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert 
} from "react-native";
import { useLocalSearchParams, useRouter, Href } from "expo-router";
import { collection, doc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useThemeColors } from "@/hooks/useThemeColors";

interface ScheduleData {
  id: string;
  orgId: string;
  weekStart: string;
  days: {
    [day: string]: {
      roles: {
        role: string;
        shifts: {
          startTime: string;
          endTime: string;
          employeeId: number | null;
        }[];
      }[];
    };
  };
  generatedAt: string;
  availabilityDeadline?: string; 
  isPublished?: boolean;
}

const ManageSchedules: React.FC = () => {
  const { orgId } = useLocalSearchParams() as { orgId: string };
  const router = useRouter();
  const colors = useThemeColors();
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(true);

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchSchedules = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const schedulesRef = collection(db, "Organizations", orgId, "weekSchedules");
      const querySnapshot = await getDocs(schedulesRef);
      const scheduleData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ScheduleData[];
      const sortedSchedules = scheduleData.sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());
      setSchedules(sortedSchedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      Alert.alert("Error", "Failed to fetch schedules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [orgId]);

  const handleDeleteSchedule = async (scheduleId: string, weekStart: string) => {
    Alert.alert(
      "Delete Schedule",
      `Are you sure you want to delete the schedule starting ${weekStart}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const docRef = doc(db, "Organizations", orgId, "weekSchedules", scheduleId);
              await deleteDoc(docRef);
              Alert.alert("Success", "Schedule deleted successfully");
              fetchSchedules();
            } catch (error) {
              console.error("Error deleting schedule:", error);
              Alert.alert("Error", "Failed to delete schedule.");
            }
          }
        }
      ]
    );
  };

  const handlePublishSchedule = async (scheduleId: string, weekStart: string) => {
    Alert.alert(
      "Publish Schedule",
      `Are you sure you want to publish the schedule starting ${weekStart}? Once published, members will see this schedule.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Publish", 
          onPress: async () => {
            try {
              const scheduleDocRef = doc(db, "Organizations", orgId, "weekSchedules", scheduleId);
              await updateDoc(scheduleDocRef, {
                isPublished: true,
                publishedAt: new Date().toISOString(),
              });
              Alert.alert("Success", "Schedule published successfully!");
              fetchSchedules();
            } catch (error) {
              console.error("Error publishing schedule:", error);
              Alert.alert("Error", "Failed to publish schedule.");
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Manage Week Schedules</Text>
      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/protected/adminOrganization/${orgId}/weekSchedule?weekStart=${item.weekStart}` as Href
                )
              }
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>Week Starting: {item.weekStart}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.icon }]}>Availability Deadline: {item.availabilityDeadline || "N/A"}</Text>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => handlePublishSchedule(item.id, item.weekStart)}
                style={styles.publishButton}
              >
                <Text style={styles.publishButtonText}>Publish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteSchedule(item.id, item.weekStart)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  card: { padding: 16, borderRadius: 8, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardSubtitle: { fontSize: 14, marginTop: 4 },
  actionButtons: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-around",
  },
  publishButton: { backgroundColor: "#28a745", padding: 8, borderRadius: 5 },
  publishButtonText: { color: "#fff", fontWeight: "bold" },
  deleteButton: { backgroundColor: "#dc3545", padding: 8, borderRadius: 5 },
  deleteButtonText: { color: "#fff", fontWeight: "bold" }
});

export default ManageSchedules;
