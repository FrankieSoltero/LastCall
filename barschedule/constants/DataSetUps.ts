import { Timestamp } from "firebase/firestore";

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

export { RouteParams, OrgSetUp, Employee };