import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "@/AuthContext";
import { db } from "@/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";


const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


export default function Availability() {
 const { user } = useAuth();
 const [availability, setAvailability] = useState<any>({});
 const [editingDay, setEditingDay] = useState<string | null>(null);
 const [tempTime, setTempTime] = useState(new Date());
 const [showPicker, setShowPicker] = useState(false);
 const [pickerMode, setPickerMode] = useState<"start" | "end">("start");


 // Fetch current availability
 useEffect(() => {
   const fetchAvailability = async () => {
     if (!user) return;
     const userRef = doc(db, "Users", user.uid);
     const userSnap = await getDoc(userRef);
     const data = userSnap.data();
     if (data?.availability) setAvailability(data.availability);
   };
   fetchAvailability();
 }, [user]);


 const handleTimeSelect = (day: string, mode: "start" | "end") => {
   setEditingDay(day);
   setPickerMode(mode);
   setTempTime(new Date());
   setShowPicker(true);
 };


 const handleTimeChange = (event: any, selectedDate?: Date) => {
   if (event.type === "set" && editingDay && selectedDate) {
     const time = selectedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
     setAvailability((prev: any) => ({
       ...prev,
       [editingDay]: {
         ...prev[editingDay],
         [pickerMode]: time,
         status: "available"
       }
     }));
   }
   setShowPicker(false);
   setEditingDay(null);
 };


 const handleFullDay = (day: string) => {
   setAvailability((prev: any) => ({
     ...prev,
     [day]: { start: "00:00", end: "23:59", status: "full" }
   }));
 };


 const handleNotAvailable = (day: string) => {
   setAvailability((prev: any) => ({
     ...prev,
     [day]: { start: null, end: null, status: "unavailable" }
   }));
 };


 const handleSave = async () => {
   if (!user) return;
   try {
     const userRef = doc(db, "Users", user.uid);
     await setDoc(userRef, { availability }, { merge: true });
     Alert.alert("Success", "Availability saved.");
   } catch (error) {
     console.error("Error saving availability:", error);
     Alert.alert("Error", "Failed to save availability.");
   }
 };


 return (
   <ScrollView contentContainerStyle={styles.container}>
     <Text style={styles.title}>Set Your Weekly Availability</Text>
     {days.map((day) => (
       <View key={day} style={styles.dayContainer}>
         <Text style={styles.dayTitle}>{day}</Text>
         <View style={styles.row}>
           <TouchableOpacity style={styles.timeButton} onPress={() => handleTimeSelect(day, "start")}>
             <Text style={styles.buttonText}>
               Start: {availability[day]?.start || "--:--"}
             </Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.timeButton} onPress={() => handleTimeSelect(day, "end")}>
             <Text style={styles.buttonText}>
               End: {availability[day]?.end || "--:--"}
             </Text>
           </TouchableOpacity>
         </View>
         <View style={styles.row}>
           <TouchableOpacity style={styles.optionButton} onPress={() => handleFullDay(day)}>
             <Text style={styles.buttonText}>Full Day</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.optionButton, { backgroundColor: "#dc3545" }]} onPress={() => handleNotAvailable(day)}>
             <Text style={styles.buttonText}>Not Available</Text>
           </TouchableOpacity>
         </View>
       </View>
     ))}
     <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
       <Text style={styles.saveText}>Save Availability</Text>
     </TouchableOpacity>


     {showPicker && (
       <Modal
       transparent
       animationType="slide"
       visible={showPicker}
       onRequestClose={() => setShowPicker(false)}
     >
       <View style={styles.modalContainer}>
         <View style={styles.modalContent}>
           <Text style={styles.modalTitle}>
             Select {pickerMode === "start" ? "Start" : "End"} Time
           </Text>
           <DateTimePicker
             value={tempTime}
             mode="time"
             display="spinner"
             onChange={(event, selectedTime) => {
               if (event.type === "set" && selectedTime) {
                 setTempTime(selectedTime);
               }
             }}
           />
           <View style={styles.modalButtons}>
             <TouchableOpacity
               style={styles.modalButton}
               onPress={() => {
                 if (editingDay) {
                   const time = tempTime.toLocaleTimeString([], {
                     hour: "2-digit",
                     minute: "2-digit",
                     hour12: false,
                   });
                   setAvailability((prev: any) => ({
                     ...prev,
                     [editingDay]: {
                       ...prev[editingDay],
                       [pickerMode]: time,
                       status: "available",
                     },
                   }));
                 }
                 setShowPicker(false);
               }}
             >
               <Text style={styles.modalButtonText}>Save</Text>
             </TouchableOpacity>


             {/* Close Button (only for end time) */}
         {pickerMode === "end" && (
           <TouchableOpacity
             style={[styles.modalButton, { backgroundColor: "#ff9800" }]}
             onPress={() => {
               if (editingDay) {
                 setAvailability((prev: any) => ({
                   ...prev,
                   [editingDay]: {
                     ...prev[editingDay],
                     end: "CLOSE",
                     status: "available",
                   },
                 }));
               }
               setShowPicker(false);
             }}
           >
             <Text style={styles.modalButtonText}>CLOSE</Text>
           </TouchableOpacity>
         )}


             <TouchableOpacity
               style={[styles.modalButton, { backgroundColor: "#dc3545" }]}
               onPress={() => setShowPicker(false)}
             >
               <Text style={styles.modalButtonText}>Cancel</Text>
             </TouchableOpacity>
           </View>
         </View>
       </View>
     </Modal>
   )}
   </ScrollView>
 );
}


const styles = StyleSheet.create({
 container: { padding: 20, backgroundColor: "#111d3e" },
 title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 16 },
 dayContainer: { marginBottom: 24 },
 dayTitle: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 8 },
 row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
 timeButton: { backgroundColor: "#007bff", padding: 10, borderRadius: 6, flex: 1, marginRight: 8 },
 optionButton: { backgroundColor: "#28a745", padding: 10, borderRadius: 6, flex: 1, marginRight: 8 },
 buttonText: { color: "#fff", textAlign: "center" },
 saveButton: { backgroundColor: "#ffc107", padding: 14, borderRadius: 6, marginTop: 20 },
 saveText: { color: "#000", fontWeight: "bold", textAlign: "center" },
 modalContainer: {
   flex: 1,
   justifyContent: "center",
   alignItems: "center",
   backgroundColor: "rgba(0, 0, 0, 0.5)",
 },
 modalContent: {
   backgroundColor: "#fff",
   padding: 20,
   borderRadius: 10,
   width: "80%",
   alignItems: "center",
 },
 modalTitle: {
   fontSize: 18,
   fontWeight: "bold",
   marginBottom: 10,
 },
 modalButtons: {
   flexDirection: "row",
   marginTop: 20,
   width: "100%",
   justifyContent: "space-between",
 },
 modalButton: {
   backgroundColor: "#28a745",
   padding: 10,
   borderRadius: 6,
   flex: 1,
   marginHorizontal: 5,
   alignItems: "center",
 },
 modalButtonText: {
   color: "#fff",
   fontWeight: "bold",
 },
 });


