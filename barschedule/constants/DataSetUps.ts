import { Timestamp } from "firebase/firestore";
import { StyleSheet } from "react-native";

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
    name?: string,
  }
  interface Availability {
    Wednesday?: string,
    Thursday?: string,
    Friday?: string,
    Saturday?: string,
    Sunday?: string,
    Monday?: string,
    Tuesday?: string,
  }

const styles = StyleSheet.create({
    
})

export { RouteParams, OrgSetUp, Employee, Availability };