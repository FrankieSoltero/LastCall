// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import AsyncStorage  from '@react-native-async-storage/async-storage';
import { initializeAuth, getAuth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth/react-native";
import { doc, Firestore, getDoc, getFirestore, Timestamp } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAOpFf2yvM88amDvYxnVSMSy3zijs5WS4w",
  authDomain: "bar-scheduler-logins.firebaseapp.com",
  projectId: "bar-scheduler-logins",
  storageBucket: "bar-scheduler-logins.appspot.com",
  messagingSenderId: "572077367920",
  appId: "1:572077367920:web:a361d0d6a722accf3f4ab5",
  measurementId: "G-DS9RQ55W24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app);

const db = getFirestore(app);

type RouteParams ={
  orgId: string;
};
interface OrgSetUp {
  id?: string;
  name: string;
  description: string;
  inviteLinks?: {
    token: string;
    createdAt: Date;
    expiresAt: Date;
  }[];
  role?: string;
}
interface Employee {
  FirstName: string,
  LastName: string,
  email: string,
  userId: string,
  role?: string,
  requestedAt?: Timestamp,
  status?: string,
  name?: string
}
export { app, auth, db, OrgSetUp, RouteParams, Employee};

