import { Link, router, Stack, useNavigation, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Button, Alert, FlatList, Platform, Dimensions, Modal, Pressable, TouchableOpacity, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useAuth } from "@/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebaseConfig";


const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const times = ["12:00 am", "1:00 am", "2:00 am", "3:00 am", "4:00 am", "5:00 am", "6:00 am", "7:00 am", "8:00 am", "9:00 am", "10:00 am", "11:00 am", "12:00 pm", "1:00 pm", "2:00 pm", "3:00 pm", "4:00 pm", "5:00 pm", "6:00 pm", "7:00 pm", "8:00 pm", "9:00 pm", "10:00 pm", "11:00 pm"];


export default function availabilityScheduler() {
    /**
     * We use this array async variable to get the array of when someone is available
     */
    const [availability, setAvailability] = useState(
        Array(days.length).fill(null).map(() => Array(times.length).fill(false))
    );
    const toggleAvailability = (dayIndex: number, timeIndex: number) => {
        const updatedAvailability = availability.map((day, dIndex) =>
            day.map((time, tIndex) =>
                dIndex === dayIndex && tIndex === timeIndex ? !time : time
            )
        );
        setAvailability(updatedAvailability);
    }
    //I will comment over this when we get employees fully into an organization - Frankie
    return (
        <ScrollView horizontal>
            <View style={styles.container}>
                <View style={styles.row}>
                    <Text style={styles.emptyCell} />
                    {times.map((time, index) => (
                        <Text key={index} style={styles.headerCell}>{time}</Text>
                    ))}
                </View>
                {days.map((day, dayIndex) => (
                    <View key={dayIndex} style={styles.row}>
                        <Text style={styles.dayCell}>{day}</Text>
                        {times.map((_, timeIndex) => {
                            return (
                            <TouchableOpacity 
                                key={timeIndex}
                                style={[
                                    styles.timeCell,
                                    availability[dayIndex][timeIndex] && styles.selectedCell,
                                ]}
                                onPress={() => toggleAvailability(dayIndex, timeIndex)}>
                                    <Text style={styles.selectedCell}>
                                        {availability[dayIndex][timeIndex] ? "Check": ""}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                ))}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        flexDirection: "column",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    emptyCell: {
        width: 60,
    },
    headerCell: {
        width: 60,
        textAlign: "center",
        fontWeight: "bold",
        paddingVertical: 8,
    },
    timeCell: {
        width: 60,
        height: 40,
        margin: 2,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        borderRadius: 4
    },
    selectedCell: {
        backgroundColor: "#4caf50"
    },
    cellText: {
        color: "white",
        fontWeight: "bold"
    },
    dayCell: {
        width: 60,
        fontWeight: "bold"
    }
})