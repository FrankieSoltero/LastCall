
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "@/AuthContext";
import { db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

export default function MemberHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, "Users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.warn("User document not found.");
          return;
        }

        const userData = userSnap.data();
        const firstName = userData?.FirstName || "User";
        const userOrgs = userData?.employeeOrgs || [];

        setUserName(firstName);
        setOrganizations(userOrgs);
      } catch (error) {
        console.error("Error fetching user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [user]);

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {userName} 👋</Text>

      <Text style={styles.subtitle}>Your Organizations:</Text>
      {organizations.length === 0 ? (
        <Text style={{ color: "#ccc", marginTop: 10 }}>
          You are not part of any organizations yet.
        </Text>
      ) : (
        <FlatList
          data={organizations}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orgButton}
              onPress={() => router.push(`/protected/memberOrganizations/${item}`)}
            >
              <Text style={styles.orgButtonText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#111d3e",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#d4f4b3",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  orgButton: {
    backgroundColor: "#d4f4b3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  orgButtonText: {
    color: "#111d3e",
    fontWeight: "bold",
    textAlign: "center",
  },
});
