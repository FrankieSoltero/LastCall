import { AuthProvider, useAuth } from "@/AuthContext";
import React, { Fragment, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, Href, useRouter } from "expo-router";

//IMPORT THE DATEPICKER
import DatePicker from "react-native-date-picker";
import { db } from "@/firebaseConfig";
import { doc, setDoc, collection } from "firebase/firestore";

const CreateSchedule: React.FC = () => {
  const router = useRouter();

  //get org ID from URL
  const { orgId } = useLocalSearchParams();

  //Sets number of days for the schedule
  //The manager can choose how long they want schedule to be (5 days or 7 days, or 2 weeks)
  const [numDays, setNumDays] = useState<number | null>(null);

  //Store start date which they choose with the picker
  //IMPORTANT because this is how that schedule is labeled
  const [startDate, setStartDate] = useState<Date | null>(null);

  //Shows the picker
  const [open, setOpen] = useState(false);

  //Schedule stored as array of dates which we can add shifts into
  const [schedule, setSchedule] = useState<Date[]>([]);

  //make sure orID is string
  const orgIdString = Array.isArray(orgId) ? orgId[0] : orgId;


  //Date selection with the imported picker
  const handleDateConfirm = (selectedDate: Date) => {
    setStartDate(selectedDate); //seleccted start picker
    setOpen(false); //close it
  };

  //Need this helper because ran into issues with different dates passing in differetn time zones(?) like UTC 
  //Formats the date in YYYY-MM-DD
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  

  //Generates the week schedule 
  //aves it to Firestore as a subcollection under Organizations/{orgId}/weekSchedules
  const generateWeekSchedule = async () => {
    if (numDays && startDate && orgId) {
      const newSchedule: Date[] = [];   //ARRAY to hold schedule just generated 
      const daysData: { [key: string]: any } = {}; // Object to hold day-specific data (roles, start time, whatever)
      let currentDate = new Date(startDate); //Start from the selected start date

      //generate schedule for number of days chosen
      for (let i = 0; i < numDays; i++) {
        const day = new Date(currentDate);
        newSchedule.push(day); //add date to schedule array
        const dayKey = formatLocalDate(day); //String key for the day "2025-03-20" //formatlocal date function is used so in correct time zone
        daysData[dayKey] = { roles: [] }; //Days object is initializaed with roles
        currentDate.setDate(currentDate.getDate() + 1); // then go onto the next day
      }

      //set generated schedule to the state
      setSchedule(newSchedule);

      //Use startDate as the week start (YYYY-MM-DD)
      //format local date
      const weekStartFormatted = formatLocalDate(startDate);

      //docID for the firestore
      const docId = `${orgId}_${weekStartFormatted}`;

      //this sets an availability deadline to 2 days before the start date
      //This saves in firestore right now 
      //My thought process was that this could be used on the member side to show up as an alert for members to input their 
      //availability before the schedule start date 
      //similar to how peter asks us for availability by monday
      const availabilityDeadline = new Date(startDate);
      availabilityDeadline.setDate(availabilityDeadline.getDate() - 2);
      //formatelocal date
      const availabilityDeadlineFormatted = formatLocalDate(availabilityDeadline);


      //FIRESTORE STORAGE
      try {
        //create a reference to the subcollection "weekSchedules" under Organizations/{orgId}
        //tried to do this to a similar way you saved employees
        const weekScheduleRef = doc(collection(db, "Organizations", orgIdString, "weekSchedules"), docId);
        await setDoc(weekScheduleRef, {
          orgId,    //orgID obviously
          weekStart: weekStartFormatted, //when the start of the week is
          availabilityDeadline: availabilityDeadlineFormatted,   //this is saved so you can use this for member side
          days: daysData,   //days saved with roles
          generatedAt: new Date().toISOString(),   //shows when it was generated

        //save to firestore
        }, { merge: false });

        //show if it successfully generated
        Alert.alert("Success", "Week schedule generated and saved!");
      } catch (error: any) {
        //show error if something wrong
        console.error("Error generating week schedule:", error);
        Alert.alert("Error", "Failed to generate week schedule.");
      }
    } else {
      Alert.alert("Missing Data", "Please enter the number of days and select a start date."); //alert if data like week start is missing
    }
  };

  //what it looks like
  //At the top there is a back button and create schedule
  //then the manager chooses how many days the schedule should last
  //then they choose the start date
  //then choose generate schedule
  //then they can either view this week schedule (which will only work if the schedule is the week they are editing like a 3/17 )
  //or they can view all the schedules they are editing
  //in this week schedule it will bring them to weekSchedule which just has the days of the schedule in a better layout, form theire you can click into each day
  //then they can choose to delete a schedule or publish a schedule
  //If they delete a schedule, it will competely erase from firestore
  //Publish button i created for member side for when manager wants to officially publish a schedule, but hasn't been implemented on member side
  //but eventually
  //can click into whichever schedule and it will bring them to the week layout for that particular schedule
  return (
    <View style={{ padding: 20 }}>
      {/* Back Button OPEN TO CHANGING THIS I JUST NEEDED FOR TESTING. I think you said yu were gonna make it a sidebar*/}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      
      
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10, color: "white" }}>
        Create Schedule
      </Text>

      {!numDays && (
        <>
          <Text style={{ color: "white" }}>Enter how many days the schedule should last:</Text>
          <TextInput
            placeholder="Number of Days"
            placeholderTextColor="white"
            keyboardType="numeric"
            onChangeText={(text) => setNumDays(parseInt(text) || null)}
            style={styles.input}
          />
        </>
      )}

      {numDays && !startDate && (
        <>
          <TouchableOpacity onPress={() => setOpen(true)} style={styles.button}>
            <Text style={styles.buttonText}>Select Start Date</Text>
          </TouchableOpacity>
          {open && (
            <DatePicker
              date={startDate || new Date()}
              onDateChange={handleDateConfirm}
              mode="date"
              open={open}
              onConfirm={handleDateConfirm}
              onCancel={() => setOpen(false)}
              modal={true}
            />
          )}
        </>
      )}

      {startDate && (
        <Text style={{ marginTop: 10, color: "white" }}>
          Selected Start Date: {startDate.toDateString()}
        </Text>
      )}

      {startDate && numDays && (
        <TouchableOpacity onPress={generateWeekSchedule} style={[styles.button, styles.greenButton]}>
          <Text style={styles.buttonText}>Generate Week Schedule</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => router.push(
          //make sure that in router push you include the formatted start date or itll get fucked up
          `/protected/adminOrganization/${orgIdString}/weekSchedule?weekStart=${startDate ? formatLocalDate(startDate) : ""}` as Href
        )}
        style={styles.viewSchedulesButton}
      >
        <Text style={styles.viewSchedulesButtonText}>View & Edit This Week Schedule</Text>
      </TouchableOpacity>


      {schedule.length > 0 && (
        <ScrollView horizontal style={styles.scheduleContainer}>
          {schedule.map((date, index) => (
            <View key={index}>
              <TouchableOpacity
                key={index}
                style={styles.scheduleDate}
                onPress={() =>
                  router.push(
                    `/protected/adminOrganization/${orgId}/daySchedule?date=${formatLocalDate(date)}&weekStart=${startDate ? formatLocalDate(startDate) : ""}` as Href
                  )
                }
              >
                <Text>{date.toDateString()}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
      <TouchableOpacity
      onPress={() => router.push(
        `/protected/adminOrganization/${orgId}/scheduleTemp?weekStart=${startDate ? formatLocalDate(startDate) : ""}` as Href
      )}
        style={styles.viewSchedulesButton}
      >
        <Text style={styles.viewSchedulesButtonText}>View & Edit All Schedules</Text>
      </TouchableOpacity>

    </View>
  );
};

//diff styles
//will edit once we are fully functinal, looks a bit ugly right now, but lets wait until availability is done lol
const styles = StyleSheet.create({
  backButton: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  viewSchedulesButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  viewSchedulesButtonText: {
    color: "white",
    textAlign: "center",
  },  
  input: { borderWidth: 1, padding: 8, marginBottom: 10 },
  button: { marginBottom: 10, padding: 10, backgroundColor: "#007bff", borderRadius: 5 },
  greenButton: { backgroundColor: "#28a745", marginTop: 20 },
  buttonText: { color: "white", textAlign: "center" },
  scheduleContainer: { marginTop: 20, flexDirection: "row", paddingBottom: 20 },
  scheduleDate: {
    marginRight: 10,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 5,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

//export
export default CreateSchedule;
