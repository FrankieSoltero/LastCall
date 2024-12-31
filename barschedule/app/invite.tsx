import React, { useEffect, useState } from "react";
import { Href, router, useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator, Platform } from "react-native";
import { getDoc, doc, updateDoc, arrayUnion, collection, addDoc, setDoc } from "firebase/firestore";
import { db, OrgSetUp } from "@/firebaseConfig";
import { useAuth } from "@/AuthContext";
import { TouchableOpacity } from "react-native-gesture-handler";

export default function Invite() {
    /**
     * OrgId, Token are pulled from the URL in the invite link
     * User is pulled from our useAuth Function
     * loading variable to allow for our data to be fetched before moving onto anythin else
     * Valid link is used as a boolean to make sure the link is valid before proceeding
     * Our data variable is used to store our org Data
     */
    const { orgId, token } = useLocalSearchParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [validLink, setValidLink] = useState(false);
    const [data, setData] = useState<OrgSetUp | null>(null);

    useEffect(() => {
        /**
         * Validating Invite is a function to validate the invite that was given through the url
         * it returns nothing
         * We first check if the orgID is null
         * Then we check if the Database is null before proceeding
         * Next we surround our code in a try catch 
         * our Orgref variable stores our reference to our orgDocument
         * our orgDoc stores the actual document pulled from the reference
         * We check if the document exists through the exists function
         * next we store our data in a non async variable to prevent a race condition
         * InviteLinks is used to store the current invite links in the document data
         * next we get the current date 
         * then we use activeInviteLinks to check that the token matches the invite links token
         * and we also check that the inviteLink is not expired by comparing it to our now variable
         * if activeInviteLink exists then we set our valid invite link boolean to true
         * then we set data last
         * then finally we set our loading variable to false
         * then updating our orgId and Token
         */
        const validatingInvite = async () => {
            if (orgId == null) {
                console.log("The orgId is null, ", orgId);
            }
            if (db == null) {
                console.log("The Data Base Doesn't exist");
            }
            try {
                console.log(orgId);
                const orgRef = doc(db, "Organizations", orgId as string);
                const orgDoc = await getDoc(orgRef);
                if (orgDoc.exists()!) {
                    console.log("Org Document does not exist");
                }
                const data = { id: orgId, ...orgDoc.data() } as OrgSetUp;
                console.log("Data: "  + data);
                const inviteLinks = orgDoc.data()?.inviteLinks || [];
                const now = new Date();
                const activeInviteLink = inviteLinks.find(
                    (link: any) => link.token === token as string && link.expiresAt.toDate() > now
                );
                if (activeInviteLink) {
                    setValidLink(true);
                }
                else {
                    console.log("Invalid invite");
                }
                setData(data);
            }
            catch (error: any) {
                console.log("Error: ", error.message);
            }
            finally {
                setLoading(false);
            }
        }
        validatingInvite();
    }, [orgId, token]);
    /**
     * First we check that our orgId and User is valid
     * Then we surround the rest of our code in a try catch
     * OrgRef stores the reference to our document
     * orgDoc stores the document data
     * if the orgDoc exists then proceed
     * then we create a subCollection for pending employees
     * then we add the document with all the data required for a pending employee
     * if the platform is a website then push to the website side
     * if its not push to the app dashboard
     * @returns 
     */
    const handleJoinOrganization = async () => {
        if (!user || !orgId) {
            router.push(`/?redirect=/invite?orgId=${orgId}&token=${token}`);
            return;
        }
        try {
            const userRef = doc (db, "Users", user.uid);
            const orgRef = doc(db, "Organizations", orgId as string);
            const orgDoc = await getDoc(orgRef);
            const userDoc = await getDoc(userRef);
            if (!orgDoc.exists() || !userDoc.exists()){
                console.log("Docs do not exist");
                return;
            }
            const data = userDoc.data();
            const pendingEmployeeRef = doc(orgRef, "PendingEmployees", user.uid);
            const pendingEmployeeDoc = await getDoc(pendingEmployeeRef);
            if (pendingEmployeeDoc.exists()){
                console.log("Employee already requested");
                return;
            }
            const now = new Date();
            await setDoc(pendingEmployeeRef, {
                userId: user.uid,
                email: user.email,
                FirstName: data.FirstName,
                LastName: data.LastName,
                requestedAt: now,
                status: "pending"
            });
            if (Platform.OS === "web") {
                router.replace("/(website)/dashboard" as Href);
            }
            else {
                router.replace("/(app)/");
            }
        }
        catch (error: any) {
            console.log("Error joining Organization: ", error.message);
        }
    };
    /**
     * If its loading return an Activity Indicator
     */
    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff"/>
    }
    /**
     * if the invite link is invalid then return a message explaining the error
     */
    if (!validLink) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>This invite link is invalid and or has expired</Text>
            </View>
        )
    }
    //We reconstruct the url
    const inviteURL = `/invite?orgId=${orgId}&token=${token}`;
    /**
     * We style the the join button to have the organization title
     * then we use our ? to determine whether a login message shows up or a join button
     */
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Join {data?.name}</Text>
            <Text style={styles.text}>You have been invited to join {data?.name}</Text>
            {user ? (
                <Button title="Join Organization" onPress={handleJoinOrganization} />
            ) : (
                <Button title="Log in to Join"
                    onPress={() => router.replace(`/?redirect=${encodeURIComponent(inviteURL)}`)} />
            )}
        </View>
    );
}
//Our style variable
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
    },
    text: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20
    },
    errorText: {
        fontSize: 18,
        color: "red",
        textAlign: "center"
    }
})