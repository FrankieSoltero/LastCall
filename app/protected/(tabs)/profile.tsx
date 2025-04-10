import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, Button, StyleSheet, Switch, Animated } from 'react-native';
import { fetchUserProfile, updateUserProfile } from '@/constants/userService';
import { useAuth } from '@/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { useThemeColors } from "@/hooks/useThemeColors";

const Profile = () => {
  // State for profile fields
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  // State for push notifications preference
  const [pushNotifications, setPushNotifications] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCheckmark, setShowCheckmark] = useState<boolean>(false);
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const { user, loading: authLoading } = useAuth();
  const colors = useThemeColors(); // custom hook to get theme colors

  // Fetch user profile data when the component mounts
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await fetchUserProfile();
        setFirstName(profileData.FirstName || "");
        setLastName(profileData.LastName || "");
        setEmail(profileData.email || "");
        setPushNotifications(profileData.pushNotifications || false);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Save changes for push notifications (names and email are read-only)
  const handleSaveChanges = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Email is missing.');
      return;
    }
    try {
      await updateUserProfile({
        FirstName: firstName, // read-only field
        LastName: lastName,   // read-only field
        email,                // read-only field
        pushNotifications,
      });
      Alert.alert('Success', 'Profile updated successfully!');
      // Show animated checkmark
      setShowCheckmark(true);
      Animated.timing(checkmarkOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(checkmarkOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => setShowCheckmark(false));
        }, 1500);
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // Sign Out Function
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  // Delete Account Function with confirmation
  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;
              if (currentUser) {
                await currentUser.delete();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (loading || authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Profile Page</Text>

      {/* First Name Field (read-only) */}
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
        placeholder="First Name"
        value={firstName}
        editable={false}
        selectTextOnFocus={false}
      />
      {/* Last Name Field (read-only) */}
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
        placeholder="Last Name"
        value={lastName}
        editable={false}
        selectTextOnFocus={false}
      />
      {/* Email Field (read-only) */}
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
        placeholder="Email"
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={false}
        selectTextOnFocus={false}
      />

      {/* Push Notifications Toggle */}
      <View style={styles.switchContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Push Notifications</Text>
        <Switch
          value={pushNotifications}
          onValueChange={setPushNotifications}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={pushNotifications ? "#f5dd4b" : "#f4f3f4"}
        />
      </View>

      <Button title="Save Changes" onPress={handleSaveChanges} />

      {/* Animated Checkmark */}
      {showCheckmark && (
        <Animated.View style={{ opacity: checkmarkOpacity }}>
          <Text style={[styles.checkmark, { color: "green" }]}>✓</Text>
        </Animated.View>
      )}

      {/* Sign Out and Delete Account Buttons */}
      <View style={styles.buttonContainer}>
        <Button title="Sign Out" onPress={handleSignOut} />
        <Button title="Delete Account" onPress={handleDeleteAccount} color="red" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    height: 40,
    borderColor: '#ccc',
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkmark: {
    fontSize: 30,
    textAlign: 'center',
    color: 'green',
  },
});

export default Profile;
