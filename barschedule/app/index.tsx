import { Link, router, Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"
import { app } from "../firebaseConfig";

//This function here exports the User Login Text by using the styles variable
export default function UserLogin(): JSX.Element{
  //Here we use a state variable to store emails and have a setEmail function to go with it
  const [email, setEmail] = useState<string>("");
  //We do the same as above here but for passwords
  const [password, setPassword] = useState<string>("");
  //This is used to get rid of the header so that it doesn't show up
  const navigation = useNavigation();
  //This function is to handle what happens when a user submits their login information
  const auth = getAuth(app);
  const params = useLocalSearchParams();
  const redirect = params.redirect as unknown as string;
  const handleSubmit = async (): Promise<void> => {
    //If both email and password are not null
    if (email && password){
      //Set the user login
      try{
        //Wait for the userlogin to complete
        await signInWithEmailAndPassword(auth, email,password);
        //Alert the user that the user login was saved 
        console.log("User Signed In");
        //Here we check the platform
        if (Platform.OS === "web"){
          if (redirect != null){
            router.replace(redirect);
          }
          else {
            router.replace("/website");
          }
        }
        else {
          router.replace("/app");
        }
      }
      //Here we catch any errors
      catch (error:any){
        const errorCode = error.code;
        const errorMessage = error.message;
        Alert.alert("Error", errorMessage);
      }
    }
    //Alert the user of error
    else{
      Alert.alert("Error", "Please fill both");
    }
  }
  //We use this to get rid of the header
  useEffect(() => {
    navigation.setOptions({ headerShown: false});
  } ,[navigation]);
//Here we design the components seen in the app
  return (
    //below we set the text box for email and password and allow input to be stored in the array
    <View style={styles.container}>
      <Text>User Login</Text>
      <TextInput 
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        inputMode="email"
        />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        />
      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.buttonDesign}
          onPress={handleSubmit}
          role="button"
          >
            <Text style={styles.buttonText}>Login</Text>
        </Pressable>
        <Link style={styles.buttonDesign} push href='./createaccount' asChild>
          <Pressable>
            <Text style={styles.buttonText}>Create Account</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
//This variable creates all the possible different styles we want to incorporate by defining
//multiple variables within it
const styles = StyleSheet.create({
  container: {
    flex:1,
    justifyContent: `center`,
    alignItems: `center`,
    padding: 16,
    backgroundColor: "#d4f4b3"
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
    backgroundColor: "#111d3e",
    padding: 10,
    borderRadius: 2,
    marginHorizontal: 10,
  },
  buttonText: {
    color:"#fff",
    textAlign: "center",
  },
});
 