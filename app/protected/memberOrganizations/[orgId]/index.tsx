import { Link, router, Stack, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable, TouchableOpacity, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RouteParams, Availability } from "@/constants/DataSetUps";
import React from "react";
import { useThemeColors } from '@/app/hooks/useThemeColors';


const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const times = ["12:00 am", "1:00 am", "2:00 am", "3:00 am", "4:00 am", "5:00 am", "6:00 am", "7:00 am", "8:00 am", "9:00 am", "10:00 am", "11:00 am", "12:00 pm", "1:00 pm", "2:00 pm", "3:00 pm", "4:00 pm", "5:00 pm", "6:00 pm", "7:00 pm", "8:00 pm", "9:00 pm", "10:00 pm", "11:00 pm"];

export default function availabilityScheduler() {
    const {user, loading} = useAuth();
    const orgID = useLocalSearchParams() as unknown as string;
    const [availability, setAvail] = useState({});

    const handleInput = (day: any, field: any, value: any) => {
        setAvail((prev : any) => ({
            ...prev,
            [day]: {...prev[day], [field]: value}
        }));
    }
    const handleSubmit = async (orgId: string, employeeId: string, availability: any) => {
       
    }
    //I will comment over this when we get employees fully into an organization - Frankie
    return (
        <View style={styles.container}>
            <FlatList
                data={days}
                keyExtractor={(item) => item}
                renderItem={({item}) => (
                    <View style={styles.dayContainer}>
                        <Text style={styles.dayLabel}>{item}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Start time (e.g, 9:00)"
                            onChangeText={(value) => handleInput(item, "start",value)}
                        />
                         <TextInput
                            style={styles.input}
                            placeholder="End time (e.g, 17:00)"
                            onChangeText={(value) => handleInput(item, "start",value)}
                        />
                    </View>
                )}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    dayContainer: {
        marginBottom: 16,
    },
    dayLabel: {
        fontSize: 18,
        fontWeight: "bold"
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 4,
        padding: 8,
        marginVertical: 4
    }
});