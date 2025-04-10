import React, { useEffect, useState } from "react";
import { Href, useLocalSearchParams, router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/AuthContext";
import { OrgSetUp } from "@/constants/DataSetUps";

export default function Invite() {
  const { orgId, token } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [orgData, setOrgData] = useState<OrgSetUp | null>(null);

  useEffect(() => {
    const validateInviteLink = async () => {
      if (!orgId || !token) return;

      try {
        const orgRef = doc(db, "Organizations", orgId as string);
        const orgDoc = await getDoc(orgRef);

        if (!orgDoc.exists()) return;

        const orgDetails = { id: orgId, ...orgDoc.data() } as OrgSetUp;
        const inviteLinks = orgDetails.inviteLinks || [];
        const now = new Date();

        const activeInvite = inviteLinks.find(
          (link: any) => link.token === token && link.expiresAt.toDate() > now
        );

        if (activeInvite) {
          setValidLink(true);
        }

        setOrgData(orgDetails);
      } catch (error: any) {
        console.error("Error validating invite:", error.message);
      } finally {
        setLoading(false);
      }
    };

    validateInviteLink();
  }, [orgId, token]);

  const handleJoinOrganization = async () => {
    if (!user || !orgId) {
      router.push(`/?redirect=/invite?orgId=${orgId}&token=${token}`);
      return;
    }

    try {
      const userRef = doc(db, "Users", user.uid);
      const orgRef = doc(db, "Organizations", orgId as string);
      const userDoc = await getDoc(userRef);
      const orgDoc = await getDoc(orgRef);

      if (!userDoc.exists() || !orgDoc.exists()) return;

      const userData = userDoc.data();
      const pendingRef = doc(orgRef, "PendingEmployees", user.uid);
      const existingRequest = await getDoc(pendingRef);

      if (existingRequest.exists()) {
        Alert.alert("Already Requested", "You have already requested to join this organization.");
        return;
      }

      await setDoc(pendingRef, {
        userId: user.uid,
        email: user.email,
        FirstName: userData.FirstName,
        LastName: userData.LastName,
        requestedAt: new Date(),
        status: "pending",
      });

      router.replace("/protected/(tabs)/dashboard" as Href);
    } catch (error: any) {
      console.error("Error joining organization:", error.message);
      Alert.alert("Error", "Failed to send join request.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: "#d4f4b3" }]}>
        <ActivityIndicator size="large" color="#111d3e" />
      </View>
    );
  }

  if (!validLink) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>This invite link is invalid or has expired.</Text>
      </View>
    );
  }

  const inviteURL = `/invite?orgId=${orgId}&token=${token}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join {orgData?.name}</Text>
      <Text style={styles.description}>You've been invited to join {orgData?.name}.</Text>

      {user ? (
        <TouchableOpacity style={styles.button} onPress={handleJoinOrganization}>
          <Text style={styles.buttonText}>Join Organization</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace(`/?redirect=${encodeURIComponent(inviteURL)}`)}
        >
          <Text style={styles.buttonText}>Log In to Join</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d4f4b3",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111d3e",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#111d3e",
    marginBottom: 30,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: "#111d3e",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
      web: {
        transition: "all 0.3s ease",
        cursor: "pointer",
      },
    }),
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
  },
});
