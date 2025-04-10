// User Sign-Up Screen
import {
  Href,
  router,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import React from "react";

export default function CreateAccount() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [userPassword, setUserPassword] = useState<string>("");
  const [confirmPass, setConfirmPass] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userLastName, setLastName] = useState<string>("");

  const params = useLocalSearchParams();
  const redirect = params.redirect as unknown as Href;
  const navigation = useNavigation();

  // Hide the header on this screen
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Function to handle user sign-up
  const handleSubmission = async () => {
    console.log("Pressed Submit");

    // Check if all fields are filled
    if (!userName || !userLastName || !userEmail || !userPassword) {
      Alert.alert("Missing Info", "All fields must be filled out.");
      return;
    }

    // Password guideline: minimum 6 characters (Firebase default)
    if (userPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }

    // Check if passwords match
    if (userPassword !== confirmPass) {
      Alert.alert("Error", "Your Passwords Must Match");
      return;
    }

    try {
      // Firebase Auth sign-up
      const userCred = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
      const user = userCred.user;
      const userId = user.uid;
      const displayName = `${userName} ${userLastName}`;

      // Save additional user info to Firestore
      const userDocRef = doc(db, "Users", userId);
      const userData = {
        FirstName: userName,
        LastName: userLastName,
        displayName,
        email: user.email,
        employeeID: user.uid,
      };

      await setDoc(userDocRef, userData, { merge: true });

      // Notify success
      Alert.alert("Success", "Account created successfully!");

      // Redirect to dashboard or specified redirect route
      if (redirect == null) {
        router.replace("/(protected)/dashboard" as Href);
      } else {
        router.replace(redirect);
      }
    } catch (error: any) {
      console.log("Error creating account:", error.message);
      Alert.alert("Sign Up Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Create Your Account</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={userName}
          onChangeText={setUserName}
          placeholderTextColor="gray"
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={userLastName}
          onChangeText={setLastName}
          placeholderTextColor="gray"
        />
        <TextInput
          style={styles.input}
          placeholder="name@example.com"
          value={userEmail}
          onChangeText={setUserEmail}
          inputMode="email"
          placeholderTextColor="gray"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={userPassword}
          onChangeText={setUserPassword}
          secureTextEntry
          placeholderTextColor="gray"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPass}
          onChangeText={setConfirmPass}
          secureTextEntry
          placeholderTextColor="gray"
        />
        <View style={styles.buttonContainer}>
          <Button title="Submit" onPress={handleSubmission} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Style setup
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d4f4b3",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#111d3e",
  },
  input: {
    width: Platform.OS === "web" ? "50%" : "90%",
    padding: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#111d3e",
    borderRadius: 3,
    backgroundColor: "white",
    color: "black",
  },
  buttonContainer: {
    width: "60%",
    marginTop: 10,
  },
});
