import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { View, Text } from 'react-native';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile?: any;
  refreshUserProfile: () => Promise<void>;
}

// Create the auth context with a default value.
const AuthContext = createContext<AuthContextType | undefined>({
  user: null,
  loading: true,
  refreshUserProfile: async () => {},
});

// Custom hook to use the AuthContext.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component to wrap your app.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Function to fetch the user's Firestore profile document.
  const refreshUserProfile = async () => {
    if (user) {
      try {
        const userDocRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  // Subscribe to auth state changes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Optionally, you can also fetch the profile once the user is set.
  useEffect(() => {
    if (user) {
      refreshUserProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, profile, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
