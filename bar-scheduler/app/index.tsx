import { Text, View, StyleSheet, TextInput, Button, Alert} from "react-native";
import React, { useState } from "react";
//This function here exports the User Login Text by using the styles variable
export default function UserLogin(): JSX.Element{
  //Here we use a state variable to store emails and have a setEmail function to go with it
  const [email, setEmail] = useState<string>("");
  //We do the same as above here but for passwords
  const [password, setPassword] = useState<string>("");
  //Here we create a state array that will store all our users and passwords
  const [userLogin, setUserLogin] = useState<Array<{ email: String; password: string}>>([]);
//This function is to handle what happens when a user submits their login information
  const handleSubmit = (): void => {
    if (email && password){
      setUserLogin([...userLogin, {email, password}]);

      Alert.alert("Success", "User Login saved");

      setEmail("");
      setPassword("");
    }
    else{
      Alert.alert("Error", "Please fill both");
    }
  }
  const testFunc = (): void =>{
    Alert.alert("Success", "Button Works");
  }

  return (
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
        <Button title="Submit" onPress={handleSubmit}/>
        <Button title="Create Account" onPress={testFunc}/>
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
  }, 
  input: {
    width: "100%",
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
});
 