import { Link, router, Stack, useNavigation, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";
import { auth, db } from "@/firebaseConfig";
import { addDoc, arrayUnion, collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useRoute } from "@react-navigation/native";
import React from "react";


export default function HomeScreen(): React.JSX.Element {
  const { user, loading } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setorgDescription] = useState("");
  const [creating, setCreating] = useState(false);


  const handleOrgCreate = async () => {
    //handle multiple clicks
    if (creating) return;  
    setCreating(true);
    //Here we do our first check when we call org create to make sure everything is filled out
    if (!orgName || !orgDescription){
      //Sends an alert to fill the fields
      Alert.alert("Please fill in all fields");
      return;
    }
    //Here we set the creating state to true to allow a loading animation
    setCreating(true);
    try {
      //if there is no user id the user is not authenticated
      if (!user){
        console.log("Error User not Authenticated");
        //Send them back to the login
        return;
      }
      const userId = user?.uid;
      const userDocReference = doc(db, "Users", userId);
      //Here we initialize a doc at the Organizations Rules
      const userDoc = await getDoc(userDocReference);
      if (!userDoc.exists()){
        console.log("No document was found");
        return;
      }
      const userData = userDoc.data();
      const userName = userData.FirstName + " " + userData.LastName;
      //A user needs to be authenticated and make sure they are in the admins data section to create one
      const orgRef = await addDoc(collection(db, "Organizations"), {
        name: orgName,
        description: orgDescription,
      });
      const adminRef = doc(orgRef, "Employees", user.uid);
      const adminDoc = await getDoc(adminRef);
      if (adminDoc.exists()){
        console.log("Admin already exists");
        return;
      }
      const orgID = orgRef.id;
      await setDoc(adminRef, {
        userId: user.uid,
        email: user.email,
        name: userName,
        role: "Owner"
      });
      await updateDoc(userDocReference, {
        OrganizationsIDs: arrayUnion(orgID),
        AdminOrgs: arrayUnion(orgName)
      });
      Alert.alert("Organization created successfully!");
      router.replace("/protected/dashboard");
    }
    //Here we catch an error
    catch (error:any){
      console.log("Error creating organization:", error.message);
    } finally {
      //The last thing we do is set creating to false
      setCreating(false);
    }
  };
  if (loading) {
    return <Text>Loading...</Text>
  };
    return (
        <View style={styles.container}>
          <Text style={styles.title}>Create Organization</Text>
          <TextInput
            style={styles.input}
            placeholder="Organization Name"
            value={orgName}
            onChangeText={setOrgName}
            />
          <TextInput
            style={styles.input}
            placeholder="Ogranization Descritpion"
            value={orgDescription}
            onChangeText={setorgDescription}
            />
          <Button
            title={creating ? "Creating..." : "Create Organization"}
            onPress={handleOrgCreate}
            disabled={creating}
          />
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
      flex:1,
      justifyContent: `center`,
      alignItems: `center`,
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
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
      width:"60%",
      marginTop: 10,
    },
    button: {
      marginHorizontal: 10,
    },
    buttonDesign:{
      backgroundColor: "#007BFF",
      padding: 10,
      borderRadius: 2,
      marginHorizontal: 10,
    },
    buttonText: {
      color:"black",
      textAlign: "center",
    },
  });
   