import { Link, router, Stack, useNavigation } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import app from "../firebaseConfig"

//Here we define what will be shown on this page
export default function CreateAccount(): JSX.Element{
  //Here we set our variables to be used to create a user using state variables
    const [userEmail, setUserEmail] = useState<string>("");
    const [userPassword, setUserPassword] = useState<string>("");
    const [confirmPass, setConfirmPass] = useState<string>("");
    const [adminAttemptPass, setAdminAttempt] = useState<string>("");
    const adminPassword = "12345";
    //Here we create our navigation variable so we can move around
    const navigation = useNavigation();
    //We use this to get rid of the header
    useEffect(() => {
      navigation.setOptions({ headerShown: false});
    } ,[navigation]);
    //create a function to handle the account submissions
    const handleSubmission = async () => { 
      //If the passwords match then you can continue
      if (userPassword == confirmPass){
        //We surround our firebase app in a try catch that way if any error pops up we can tack it
          try{
            //Here we get the auth path for the app to be used in the create user function
            const auth = getAuth(app);
            //We use await here to wait for the function to finish fully executing before being able to be used
            const userInfo = await createUserWithEmailAndPassword(auth,userEmail, userPassword);
            //Here we get the user
            const user = userInfo.user;
            Alert.alert("Success", "User Created");
            //Route back to the login
            router.back();
          }
          //Here we check for any error
          catch(error:any){
            const errorCode = error.code;
            const errorMessage = error.message;
            Alert.alert("Error", errorMessage);
          }
        }
        //If the passwords don't match then it sends an alert to redo it 
      else{
        Alert.alert("Error", "Your Passwords Must Match")
      }
    }
    //Here we use the return function to create the visual elements
    return (
       <View style={styles.container}>
        <Text>Create Your Account</Text>
        <TextInput
            style={styles.input}
            placeholder="name@example.com"
            value={userEmail}
            onChangeText={setUserEmail}
            keyboardType="email-address"
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
        <TextInput
            style={styles.input}
            placeholder="Admin Password (Optional)"
            value={adminAttemptPass}
            onChangeText={setAdminAttempt}
            secureTextEntry
        />
        <View style={styles.buttonContainer}>
            <Pressable style={styles.buttonDesign} onPress={handleSubmission} accessibilityRole="button">
                <Text style={styles.buttonText}>Submit</Text>
            </Pressable>
        </View>
       </View>
    );
}
//Here we mess with the styles of all of our visual aspects
const styles = StyleSheet.create({
    container: {
      flex:1,
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
      color:"#fff",
      textAlign: "center",
    },
  });