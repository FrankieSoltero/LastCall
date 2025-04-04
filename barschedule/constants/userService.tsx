import { db } from "@/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Fetches the current user’s profile data from Firestore.
 */
export const fetchUserProfile = async () => {
  const auth = getAuth();
  if (!auth.currentUser) throw new Error("User not authenticated");
  const userDocRef = doc(db, "Users", auth.currentUser.uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return userDoc.data();
  } else {
    throw new Error("User profile not found");
  }
};

/**
 * Updates the current user’s profile data in Firestore.
 */
export const updateUserProfile = async (data: { FirstName?: string; LastName?: string; email?: string, pushNotifications?: boolean }) => {
  const auth = getAuth();
  if (!auth.currentUser) throw new Error("User not authenticated");
  const userDocRef = doc(db, "Users", auth.currentUser.uid);
  await updateDoc(userDocRef, data);
};
