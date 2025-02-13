import { Href, Link, router, Stack, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, sendEmailVerification } from "firebase/auth"
import { auth, db } from "../firebaseConfig"
import { useAuth } from "@/AuthContext";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import React from "react";

//Here we define what will be shown on this page
export default function CreateAccount(): React.JSX.Element {
  //Here we set our variables to be used to create a user using state variables
  const [userEmail, setUserEmail] = useState<string>("");
  const [userPassword, setUserPassword] = useState<string>("");
  const [confirmPass, setConfirmPass] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userLastName, setLastName] = useState<string>("");
  const params = useLocalSearchParams();
  const redirect = params.redirect as unknown as Href<string>;
  //Here we create our navigation variable so we can move around
  const navigation = useNavigation();
  //We use this to get rid of the header
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);
  //create a function to handle the account submissions
  const handleSubmission = async () => {
    //If the passwords match then you can continue
    if (userLastName != null && userName != null && userPassword == confirmPass) {
      //We surround our firebase app in a try catch that way if any error pops up we can tack it
      try {
        //We use await here to wait for the user creation to finish
        const userCret = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
        const user = userCret.user;
        const userId = user.uid;
        //This is where we use addDoc to add the users first and last name to their account data
        const userDocReference = doc(db, "Users", userId);
        const userData = {
          FirstName: userName,
          LastName: userLastName,
          email: user.email,
          employeeID: user.uid,
        };
        //This allows for us to set the user Document to the user ID to make it easier to query for
        await setDoc(userDocReference, userData, { merge: true });
        //Here we check the platform

        if (redirect == null) {
          router.replace("/protected/dashboard" as Href);
        }
        else {
          router.replace(redirect);
        }


      }
      //Here we check for any error
      catch (error: any) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log("Error", errorMessage);
      }
    }
    //If the passwords don't match then it sends an alert to redo it 
    else {
      Alert.alert("Error", "Your Passwords Must Match")
    }
  }
  //Here we use the return function to create the visual elements
  return (
    <View style={styles.container}>
      <Text>Create Your Account</Text>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={userName}
        onChangeText={setUserName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={userLastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="name@example.com"
        value={userEmail}
        onChangeText={setUserEmail}
        inputMode="email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={userPassword}
        onChangeText={setUserPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPass}
        onChangeText={setConfirmPass}
        secureTextEntry
      />
      <View style={styles.buttonContainer}>
        <Button title="Submit" onPress={handleSubmission} />
      </View>
    </View>
  );
}
//Here we mess with the styles of all of our visual aspects
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: `center`,
    alignItems: `center`,
    padding: 16,
  },
  input: {
    width: Platform.OS === "web" ? "50%" : "100%",
    padding: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 3,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "60%",
    marginTop: 10,
  },
  button: {
    marginHorizontal: 10,
  },
  buttonDesign: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 2,
    marginHorizontal: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
  },
});