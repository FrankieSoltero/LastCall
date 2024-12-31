import { Link, router, Stack, useNavigation } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";

//If someone could make the dashboard for the app that would be lit
export default function HomeScreen(): JSX.Element {
  const { user, loading } = useAuth();
  
  return (
    <View style={styles.container}>
    <Text style={styles.buttonText}>App Dashboard</Text>
    <View style={styles.buttonContainer}>
      <Button title="Create Organization" onPress={() => router.push("/app/modals/createOrg")}/>
    </View>
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
   