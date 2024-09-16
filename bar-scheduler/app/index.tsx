import { Link, router, Stack, useNavigation } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import app from "../firebaseConfig"
//This function here exports the User Login Text by using the styles variable
export default function UserLogin(): JSX.Element{
  //Here we use a state variable to store emails and have a setEmail function to go with it
  const [email, setEmail] = useState<string>("");
  //We do the same as above here but for passwords
  const [password, setPassword] = useState<string>("");
  //Here we create a state array that will store all our users and passwords
  const [userLogin, setUserLogin] = useState<Array<{ email: String; password: string}>>([]);
  //This is used to get rid of the header so that it doesn't show up
  const navigation = useNavigation();
//This function is to handle what happens when a user submits their login information
  const handleSubmit = async (): Promise<void> => {
    //If both email and password are not null
    if (email && password){
      //Set the user login
      try{
        const auth = getAuth(app);
        setUserLogin([...userLogin, {email, password}]);
        const userCred = await signInWithEmailAndPassword(auth, email,password);
        const user = userCred.user;
        //Alert the user that the user login was saved 
        Alert.alert("Success", "User Login");
      }
      catch (error:any){
        const errorCode = error.code;
        const errorMessage = error.message;
        Alert.alert("Error", errorMessage);
      }
    }
    //Alert the devs of error
    else{
      Alert.alert("Error", "Please fill both");
    }
  }
  //We use this to get rid of the header
  useEffect(() => {
    navigation.setOptions({ headerShown: false});
  } ,[navigation]);
  //We use this to debug the user login attempt
  useEffect(() => {
    console.log("User Login Attempt: ", userLogin)
  }, [userLogin]);
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
        keyboardType="email-address"
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
          accessibilityRole="button"
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
const { width } = Dimensions.get('window');
//This variable creates all the possible different styles we want to incorporate by defining
//multiple variables within it
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
    justifyContent: "space-between",
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
 