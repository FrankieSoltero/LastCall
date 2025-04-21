import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator } from "react-native";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/AuthContext";

//gotta get width of screen because is gonna swipe by day
const { width } = Dimensions.get("window");

export default function PublishedSchedules() {
  const { user } = useAuth();
  // Holds all published day schedules (keyed by date string)
  const [daysData, setDaysData] = useState<{ [day: string]: any }>({});
  const [loading, setLoading] = useState(true);
  // Maps employee user IDs to their names
  const [employeeMap, setEmployeeMap] = useState<{ [userId: string]: string }>({});


  useEffect(() => {
    const fetchSchedules = async () => {
      //fetch unless user is logged in
      if (!user) return;
  

      console.log("Current logged in user ID:", user?.uid);
      //fetch org like other fetches
  
      try {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        console.log("📥 Got user document:", userDoc.exists());
      
        const userData = userDoc.exists() ? userDoc.data() : null;
        const employeeOrgIds = userData?.employeeOrgIds;
        const orgId = employeeOrgIds?.[0] || null;

        console.log("🏢 employeeOrgIds:", JSON.stringify(employeeOrgIds));

        console.log("✅ Using orgId:", orgId);
      
        if (!orgId) {
          console.log("⛔ No orgId found, aborting");
          return;
        }
        //fetch employees and their name so not just showing usid
        const employeeSnapshot = await getDocs(collection(db, "Organizations", orgId, "Employees"));
        const empMap: { [userId: string]: string } = {};
        employeeSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          empMap[docSnap.id] = data.name || "Unnamed";
        });
        setEmployeeMap(empMap);
        //get week schedules, but filter for ones that are published only 
        const schedulesRef = collection(db, "Organizations", orgId, "weekSchedules");
        const snapshot = await getDocs(schedulesRef);

        const allDays: { [day: string]: any } = {};

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          console.log("🧾 Found week:", docSnap.id, "PublishedAt:", data.publishedAt);
        //not schedules that arent published
          if (!data.publishedAt || !data.days) {
            console.log("⛔ Skipping unpublished or malformed week");
            continue;
          }
        
          for (const [day, value] of Object.entries(data.days as Record<string, any>)) {
            console.log("📅 Day:", day, "Has roles?", !!value.roles);
            allDays[day] = value;
          }
        }

        setDaysData(allDays);
      } catch (err) {
        console.error("Error loading published schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
    //when user changes
  }, [user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }
//sort days for horizontal display
  const sortedDays = Object.keys(daysData).sort();

  //render with shfts with names next to it
  //split up by role like boot schedule
  //says "you" if it is your shift and the other ppls names if its not you
  return (
    <FlatList
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      data={sortedDays}
      keyExtractor={(item) => item}
      renderItem={({ item: dayKey }) => (
        <View style={[styles.page, { width }]}>
          <Text style={styles.dayTitle}>{dayKey}</Text>
          {daysData[dayKey]?.roles?.map((roleBlock: any, i: number) => (
            <View key={i} style={styles.roleBlock}>
              <Text style={styles.roleTitle}>{roleBlock.role}</Text>
              {roleBlock.shifts?.map((shift: any, j: number) => (
                <Text key={j} style={styles.shiftText}>
                  {shift.startTime} - {shift.endTime} |{" "}
                  {shift.employeeId === user.uid
                    ? "You"
                    : shift.employeeId
                    ? employeeMap[shift.employeeId] || "Unknown"
                    : "Unassigned"}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}
    />
  );
}

//styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111d3e",
    justifyContent: "center",
    alignItems: "center",
  },
  page: {
    flex: 1,
    backgroundColor: "#111d3e",
    padding: 20,
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#d4f4b3",
    marginBottom: 12,
    textAlign: "center",
  },
  roleBlock: {
    backgroundColor: "#1f2a48",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 18,
    color: "#f0f0f0",
    marginBottom: 6,
    fontWeight: "bold",
  },
  shiftText: {
    color: "#d0f0ff",
    fontSize: 15,
    marginBottom: 4,
  },
});
