# LastCall - Employee Scheduling System
## Complete Project Documentation for Frontend Development

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [Backend API Documentation](#backend-api-documentation)
7. [TypeScript Type Definitions](#typescript-type-definitions)
8. [Frontend API Client](#frontend-api-client)
9. [Security Features](#security-features)
10. [Current Implementation Status](#current-implementation-status)
11. [Frontend Development Guide](#frontend-development-guide)

---

## Project Overview

**LastCall** is a mobile-first employee scheduling application designed for the hospitality industry (bars, restaurants, etc.). It allows business owners to manage organizations, employees, schedules, shifts, and employee availability.

### Core Features
- Multi-organization support (users can belong to multiple organizations)
- Role-based access control (Owner, Admin, Employee)
- Weekly schedule creation with flexible operating days
- Employee availability submission with deadlines
- Shift management with role assignments
- Job role management (Bartender, Server, Host, etc.)
- Invite link system for adding employees

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Language**: TypeScript
- **ORM**: Prisma 7.1.0
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (JWT)
- **Security**: Helmet, express-rate-limit

### Frontend
- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **UI Components**: shadcn/ui + rn-primitives
- **State Management**: React Context API
- **API Client**: Custom fetch-based client

---

## Project Structure

```
LastCall/
├── server/                          # Backend Express API
│   ├── src/
│   │   ├── index.ts                # Main server entry point
│   │   ├── lib/
│   │   │   ├── prisma.ts           # Prisma client instance
│   │   │   └── helper.ts           # Helper functions (isOrgAdmin)
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT authentication middleware
│   │   │   └── errorHandler.ts    # Global error handler
│   │   └── routes/
│   │       ├── users.ts            # User creation (signup)
│   │       ├── organization.ts     # Organization CRUD
│   │       ├── employee.ts         # Employee management & invites
│   │       ├── schedules.ts        # Schedule management
│   │       ├── shift.ts            # Shift CRUD operations
│   │       ├── availability.ts     # Availability submissions
│   │       └── roles.ts            # Job role management
│   └── prisma/
│       └── schema.prisma           # Database schema
│
└── lastCall/                        # Frontend React Native app
    ├── app/                         # Expo Router pages
    │   └── _layout.tsx             # Root layout with AuthProvider
    ├── components/                  # Reusable UI components
    ├── contexts/
    │   └── AuthContext.tsx         # Authentication context
    ├── lib/
    │   ├── api.ts                  # API client
    │   └── supabase.ts             # Supabase client config
    └── types/
        └── api.ts                  # TypeScript type definitions
```

---

## Database Schema

### User
```prisma
model User {
  id        String   @id
  email     String   @unique
  firstName String
  lastName  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Organization
```prisma
model Organization {
  id          String   @id @default(uuid())
  name        String
  description String?
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Employee
```prisma
model Employee {
  id             String         @id @default(uuid())
  userId         String
  organizationId String
  role           EmployeeRole   @default(EMPLOYEE)  // OWNER | ADMIN | EMPLOYEE
  status         EmployeeStatus @default(PENDING)   // PENDING | APPROVED | DENIED
  requestedAt    DateTime       @default(now())
  approvedAt     DateTime?
  createdAt      DateTime       @default(now())

  @@unique([userId, organizationId])
}
```

### InviteLink
```prisma
model InviteLink {
  id             String   @id @default(uuid())
  organizationId String
  token          String   @unique
  expiresAt      DateTime
  createdById    String
  createdAt      DateTime @default(now())
}
```

### Schedule
```prisma
model Schedule {
  id                    String   @id @default(uuid())
  organizationId        String
  weekStartDate         DateTime
  availabilityDeadline  DateTime
  isPublished           Boolean  @default(false)
  publishedAt           DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([organizationId, weekStartDate])
}
```

### ScheduleDay
```prisma
model ScheduleDay {
  id         String   @id @default(uuid())
  scheduleId String
  date       DateTime
  createdAt  DateTime @default(now())

  @@unique([scheduleId, date])
}
```

### Role (Job Position)
```prisma
model Role {
  id             String   @id @default(uuid())
  organizationId String
  name           String
  createdAt      DateTime @default(now())

  @@unique([organizationId, name])
}
```

### Shift
```prisma
model Shift {
  id            String    @id @default(uuid())
  scheduleDayId String
  roleId        String
  employeeId    String?
  startTime     DateTime
  endTime       DateTime?  // Optional for "until close" shifts
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Availability
```prisma
model Availability {
  id         String             @id @default(uuid())
  employeeId String
  scheduleId String
  dayOfWeek  String             // "Monday", "Tuesday", etc.
  status     AvailabilityStatus // AVAILABLE | UNAVAILABLE | PREFERRED
  startTime  DateTime?
  endTime    DateTime?
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt

  @@unique([employeeId, scheduleId, dayOfWeek])
}
```

### EmployeeRoleAssignment
```prisma
model EmployeeRoleAssignment {
  id         String   @id @default(uuid())
  employeeId String
  roleId     String
  createdAt  DateTime @default(now())

  @@unique([employeeId, roleId])
}
```

---

## Authentication System

### Flow Overview

#### Sign Up
1. User submits: `email`, `password`, `firstName`, `lastName`
2. Frontend calls `supabase.auth.signUp(email, password)`
3. Supabase creates auth account, returns `user.id`
4. Frontend calls `POST /api/users` with `{ id, email, firstName, lastName }`
5. Backend creates user record in PostgreSQL
6. Frontend calls `GET /api/protected` to load user data
7. User is logged in

#### Sign In
1. User submits: `email`, `password`
2. Frontend calls `supabase.auth.signInWithPassword(email, password)`
3. Supabase validates credentials, returns JWT token
4. Frontend calls `GET /api/protected` to load user data
5. User is logged in

#### Sign Out
1. Frontend calls `supabase.auth.signOut()`
2. Clears session and user state

### AuthContext API

```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Usage in components:
const { user, session, loading, signIn, signUp, signOut } = useAuth();
```

### Protected Routes

All API endpoints except `POST /api/users` require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The `authMiddleware` validates the token and attaches `req.userId` for use in route handlers.

---

## Backend API Documentation

Base URL: `http://localhost:3000/api`

### User Endpoints

#### Create User (Public)
```
POST /api/users
```
**Purpose**: Create user record during signup
**Auth Required**: No
**Body**:
```json
{
  "id": "supabase-user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```
**Response**: `201 Created`
```json
{
  "id": "supabase-user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

#### Get Current User
```
GET /api/protected
```
**Purpose**: Fetch authenticated user's data
**Auth Required**: Yes
**Response**: `200 OK`
```json
{
  "message": "You are authenticated",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### Organization Endpoints

#### List Organizations
```
GET /api/organizations
```
**Purpose**: Get all organizations user has access to (owner or approved employee)
**Auth Required**: Yes
**Response**: `200 OK`
```json
[
  {
    "id": "org-id",
    "name": "Joe's Bar",
    "description": "Downtown location",
    "ownerId": "user-id",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "owner": {
      "id": "user-id",
      "email": "joe@example.com",
      "firstName": "Joe",
      "lastName": "Smith"
    },
    "_count": {
      "employees": 12,
      "schedules": 5
    }
  }
]
```

#### Get Organization Details
```
GET /api/organizations/:id
```
**Purpose**: Get single organization with full details
**Auth Required**: Yes (must be owner or approved employee)
**Response**: `200 OK`
```json
{
  "id": "org-id",
  "name": "Joe's Bar",
  "description": "Downtown location",
  "ownerId": "user-id",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "owner": {
    "id": "user-id",
    "email": "joe@example.com",
    "firstName": "Joe",
    "lastName": "Smith"
  },
  "employees": [
    {
      "id": "emp-id",
      "userId": "user-id",
      "organizationId": "org-id",
      "role": "ADMIN",
      "status": "APPROVED",
      "requestedAt": "2024-01-15T10:00:00Z",
      "approvedAt": "2024-01-15T11:00:00Z",
      "createdAt": "2024-01-15T10:00:00Z",
      "user": {
        "id": "user-id",
        "email": "employee@example.com",
        "firstName": "Jane",
        "lastName": "Doe"
      }
    }
  ],
  "roles": [
    {
      "id": "role-id",
      "organizationId": "org-id",
      "name": "Bartender",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "schedules": [
    {
      "id": "schedule-id",
      "organizationId": "org-id",
      "weekStartDate": "2024-01-22T00:00:00Z",
      "availabilityDeadline": "2024-01-20T00:00:00Z",
      "isPublished": true,
      "publishedAt": "2024-01-21T10:00:00Z",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-21T10:00:00Z"
    }
  ]
}
```

#### Create Organization
```
POST /api/organizations
```
**Purpose**: Create a new organization
**Auth Required**: Yes
**Body**:
```json
{
  "name": "Joe's Bar",
  "description": "Downtown location"  // Optional
}
```
**Response**: `201 Created`
```json
{
  "id": "org-id",
  "name": "Joe's Bar",
  "description": "Downtown location",
  "ownerId": "user-id",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "owner": {
    "id": "user-id",
    "email": "joe@example.com",
    "firstName": "Joe",
    "lastName": "Smith"
  }
}
```
**Notes**: Automatically creates an employee record for the creator with role=OWNER and status=APPROVED

#### Update Organization
```
PATCH /api/organizations/:id
```
**Purpose**: Update organization details
**Auth Required**: Yes (owner only)
**Body**:
```json
{
  "name": "Joe's Bar & Grill",  // Optional
  "description": "New description"  // Optional
}
```
**Response**: `200 OK` (same structure as Create)

#### Delete Organization
```
DELETE /api/organizations/:id
```
**Purpose**: Delete organization
**Auth Required**: Yes (owner only)
**Response**: `200 OK`
```json
{
  "message": "Organization deleted successfully"
}
```
**Notes**: Cascades to all related data (employees, schedules, shifts, etc.)

---

### Employee Endpoints

#### List Employees
```
GET /api/organizations/:orgId/employees
```
**Purpose**: List all employees in organization
**Auth Required**: Yes (approved employee or admin)
**Response**: `200 OK`
```json
[
  {
    "id": "emp-id",
    "userId": "user-id",
    "organizationId": "org-id",
    "role": "EMPLOYEE",
    "status": "APPROVED",
    "requestedAt": "2024-01-15T10:00:00Z",
    "approvedAt": "2024-01-15T11:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "user": {
      "id": "user-id",
      "email": "employee@example.com",
      "firstName": "Jane",
      "lastName": "Doe"
    }
  }
]
```

#### Create Invite Link
```
POST /api/organizations/:orgId/employees/invite
```
**Purpose**: Generate invite link for new employees
**Auth Required**: Yes (admin or owner)
**Body**:
```json
{
  "expiresInDays": 7  // Optional, default 7, min 1, max 30
}
```
**Response**: `201 Created`
```json
{
  "id": "invite-id",
  "organizationId": "org-id",
  "token": "abc123def456...",
  "expiresAt": "2024-01-22T10:00:00Z",
  "createdById": "user-id",
  "createdAt": "2024-01-15T10:00:00Z",
  "organization": {
    "id": "org-id",
    "name": "Joe's Bar"
  },
  "inviteUrl": "exp://localhost:8081/invite/abc123def456..."
}
```
**Notes**: Automatically cleans up expired invite links for the organization

#### Join Organization
```
POST /api/invite/:token
```
**Purpose**: Join organization using invite link
**Auth Required**: Yes
**Response**: `201 Created`
```json
{
  "message": "Request sent! Waiting for admin approval",
  "employee": {
    "id": "emp-id",
    "userId": "user-id",
    "organizationId": "org-id",
    "role": "EMPLOYEE",
    "status": "PENDING",
    "requestedAt": "2024-01-15T10:00:00Z",
    "approvedAt": null,
    "createdAt": "2024-01-15T10:00:00Z",
    "user": {
      "id": "user-id",
      "email": "newemployee@example.com",
      "firstName": "New",
      "lastName": "Employee"
    },
    "organization": {
      "id": "org-id",
      "name": "Joe's Bar",
      "description": "Downtown location"
    }
  }
}
```

#### Update Employee
```
PATCH /api/organizations/:orgId/employees/:employeeId
```
**Purpose**: Update employee status or role
**Auth Required**: Yes (admin or owner)
**Body**:
```json
{
  "status": "APPROVED",  // Optional: PENDING | APPROVED | DENIED
  "role": "ADMIN"        // Optional: OWNER | ADMIN | EMPLOYEE
}
```
**Response**: `200 OK`
```json
{
  "id": "emp-id",
  "userId": "user-id",
  "organizationId": "org-id",
  "role": "ADMIN",
  "status": "APPROVED",
  "requestedAt": "2024-01-15T10:00:00Z",
  "approvedAt": "2024-01-15T11:00:00Z",
  "createdAt": "2024-01-15T10:00:00Z",
  "user": {
    "id": "user-id",
    "email": "employee@example.com",
    "firstName": "Jane",
    "lastName": "Doe"
  }
}
```
**Notes**: Cannot modify owner; approving sets approvedAt timestamp

#### Remove Employee
```
DELETE /api/organizations/:orgId/employees/:employeeId
```
**Purpose**: Remove employee from organization
**Auth Required**: Yes (admin or owner)
**Response**: `200 OK`
```json
{
  "message": "Employee removed successfully"
}
```
**Notes**: Cannot remove owner

#### Assign Employee Role (Job Position)
```
POST /api/organizations/:orgId/employees/:employeeId/roles
```
**Purpose**: Assign a job role to employee (e.g., make them a Bartender)
**Auth Required**: Yes (admin or owner)
**Body**:
```json
{
  "roleId": "role-id"
}
```
**Response**: `201 Created`
```json
{
  "id": "assignment-id",
  "employeeId": "emp-id",
  "roleId": "role-id",
  "createdAt": "2024-01-15T10:00:00Z",
  "role": {
    "id": "role-id",
    "organizationId": "org-id",
    "name": "Bartender",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Remove Employee Role Assignment
```
DELETE /api/organizations/:orgId/employees/:employeeId/roles/:roleId
```
**Purpose**: Remove job role from employee
**Auth Required**: Yes (admin or owner)
**Response**: `200 OK`
```json
{
  "message": "Role assignment removed"
}
```

---

### Schedule Endpoints

#### List Schedules
```
GET /api/organizations/:orgId/schedules
```
**Purpose**: List all schedules for organization
**Auth Required**: Yes (approved employee)
**Response**: `200 OK`
```json
[
  {
    "id": "schedule-id",
    "organizationId": "org-id",
    "weekStartDate": "2024-01-22T00:00:00Z",
    "availabilityDeadline": "2024-01-20T00:00:00Z",
    "isPublished": true,
    "publishedAt": "2024-01-21T10:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-21T10:00:00Z",
    "_count": {
      "scheduleDays": 7,
      "availability": 12
    }
  }
]
```

#### Get Schedule Details
```
GET /api/schedules/:id
```
**Purpose**: Get schedule with all days, shifts, and availability
**Auth Required**: Yes (approved employee)
**Response**: `200 OK`
```json
{
  "id": "schedule-id",
  "organizationId": "org-id",
  "weekStartDate": "2024-01-22T00:00:00Z",
  "availabilityDeadline": "2024-01-20T00:00:00Z",
  "isPublished": true,
  "publishedAt": "2024-01-21T10:00:00Z",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-21T10:00:00Z",
  "organization": {
    "id": "org-id",
    "name": "Joe's Bar",
    "ownerId": "user-id"
  },
  "scheduleDays": [
    {
      "id": "day-id",
      "scheduleId": "schedule-id",
      "date": "2024-01-22T00:00:00Z",
      "createdAt": "2024-01-15T10:00:00Z",
      "shifts": [
        {
          "id": "shift-id",
          "scheduleDayId": "day-id",
          "roleId": "role-id",
          "employeeId": "emp-id",
          "startTime": "1970-01-01T17:00:00Z",
          "endTime": "1970-01-01T23:00:00Z",
          "createdAt": "2024-01-15T10:00:00Z",
          "updatedAt": "2024-01-15T10:00:00Z",
          "scheduleDay": {
            "id": "day-id",
            "date": "2024-01-22T00:00:00Z"
          },
          "role": {
            "id": "role-id",
            "name": "Bartender"
          },
          "employee": {
            "id": "emp-id",
            "userId": "user-id",
            "organizationId": "org-id",
            "role": "EMPLOYEE",
            "status": "APPROVED",
            "user": {
              "id": "user-id",
              "firstName": "Jane",
              "lastName": "Doe",
              "email": "jane@example.com"
            }
          }
        }
      ]
    }
  ],
  "availability": [
    {
      "id": "avail-id",
      "employeeId": "emp-id",
      "scheduleId": "schedule-id",
      "dayOfWeek": "Monday",
      "status": "AVAILABLE",
      "startTime": "1970-01-01T17:00:00Z",
      "endTime": "1970-01-01T23:00:00Z",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "employee": {
        "id": "emp-id",
        "userId": "user-id",
        "user": {
          "id": "user-id",
          "firstName": "Jane",
          "lastName": "Doe"
        }
      }
    }
  ]
}
```

#### Create Schedule
```
POST /api/organizations/:orgId/schedules
```
**Purpose**: Create new weekly schedule
**Auth Required**: Yes (admin or owner)
**Body**:
```json
{
  "weekStartDate": "2024-01-22",
  "availabilityDeadline": "2024-01-20",
  "operatingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]  // Optional
}
```
**Response**: `201 Created`
```json
{
  "id": "schedule-id",
  "organizationId": "org-id",
  "weekStartDate": "2024-01-22T00:00:00Z",
  "availabilityDeadline": "2024-01-20T00:00:00Z",
  "isPublished": false,
  "publishedAt": null,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "scheduleDays": [
    {
      "id": "day-id",
      "scheduleId": "schedule-id",
      "date": "2024-01-22T00:00:00Z",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```
**Notes**:
- If `operatingDays` not provided, creates all 7 days
- Deadline must be before week start date
- Unique constraint on (organizationId, weekStartDate)

#### Update Schedule
```
PATCH /api/schedules/:id
```
**Purpose**: Update schedule dates
**Auth Required**: Yes (admin or owner)
**Body**:
```json
{
  "weekStartDate": "2024-01-23",  // Optional
  "availabilityDeadline": "2024-01-21"  // Optional
}
```
**Response**: `200 OK` (same structure as Create)
**Notes**: Cannot update published schedules

#### Update Schedule Days
```
PATCH /api/schedules/:id/days
```
**Purpose**: Add or remove operating days
**Auth Required**: Yes (admin or owner)
**Body**:
```json
{
  "addDays": ["Sunday"],  // Optional
  "removeDays": ["Monday"]  // Optional
}
```
**Response**: `200 OK` (full schedule with updated days)
**Notes**:
- Cannot modify published schedules
- Cannot remove days with existing shifts

#### Publish Schedule
```
POST /api/schedules/:id/publish
```
**Purpose**: Publish schedule (make it visible to all employees)
**Auth Required**: Yes (admin or owner)
**Response**: `200 OK`
```json
{
  "message": "Schedule published successfully",
  "schedule": {
    "id": "schedule-id",
    "organizationId": "org-id",
    "weekStartDate": "2024-01-22T00:00:00Z",
    "availabilityDeadline": "2024-01-20T00:00:00Z",
    "isPublished": true,
    "publishedAt": "2024-01-21T10:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-21T10:00:00Z"
  }
}
```
**Notes**: Future: Will trigger email/SMS/push notifications

#### Delete Schedule
```
DELETE /api/schedules/:id
```
**Purpose**: Delete schedule
**Auth Required**: Yes (admin or owner)
**Response**: `200 OK`
```json
{
  "message": "Schedule deleted successfully"
}
```

---

### Shift Endpoints

#### List Shifts
```
GET /api/schedules/:scheduleId/shifts
```
**Purpose**: List all shifts for a schedule
**Auth Required**: Yes (approved employee)
**Response**: `200 OK`
```json
[
  {
    "id": "shift-id",
    "scheduleDayId": "day-id",
    "roleId": "role-id",
    "employeeId": "emp-id",
    "startTime": "1970-01-01T17:00:00Z",
    "endTime": "1970-01-01T23:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "scheduleDay": {
      "id": "day-id",
      "date": "2024-01-22T00:00:00Z"
    },
    "role": {
      "id": "role-id",
      "name": "Bartender"
    },
    "employee": {
      "id": "emp-id",
      "userId": "user-id",
      "user": {
        "id": "user-id",
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane@example.com"
      }
    }
  }
]
```

#### Create Shift
```
POST /api/schedule-days/:scheduleDayId/shifts
```
**Purpose**: Create new shift on a specific day
**Auth Required**: Yes (admin or owner)
**Body**:
```json
{
  "roleId": "role-id",
  "startTime": "17:00",
  "endTime": "23:00",  // Optional (for "until close" shifts)
  "employeeId": "emp-id"  // Optional
}
```
**Response**: `201 Created`
```json
{
  "id": "shift-id",
  "scheduleDayId": "day-id",
  "roleId": "role-id",
  "employeeId": "emp-id",
  "startTime": "1970-01-01T17:00:00Z",
  "endTime": "1970-01-01T23:00:00Z",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "scheduleDay": {
    "id": "day-id",
    "date": "2024-01-22T00:00:00Z"
  },
  "role": {
    "id": "role-id",
    "name": "Bartender"
  },
  "employee": {
    "id": "emp-id",
    "userId": "user-id",
    "user": {
      "id": "user-id",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com"
    }
  }
}
```
**Notes**:
- Cannot create shifts on published schedules
- If employee assigned, they must be qualified for the role
- Time format: "HH:MM" (24-hour)
- Times stored as UTC dates with reference date 1970-01-01

#### Update Shift
```
PATCH /api/shifts/:id
```
**Purpose**: Update shift details
**Auth Required**: Yes (admin or owner)
**Body**:
```json
{
  "startTime": "18:00",  // Optional
  "endTime": "00:00",    // Optional (can be null for "until close")
  "roleId": "role-id",   // Optional
  "employeeId": "emp-id" // Optional
}
```
**Response**: `200 OK` (same structure as Create)
**Notes**: Cannot update shifts on published schedules

#### Delete Shift
```
DELETE /api/shifts/:id
```
**Purpose**: Delete shift
**Auth Required**: Yes (admin or owner)
**Response**: `200 OK`
```json
{
  "message": "Shift deleted successfully"
}
```
**Notes**: Cannot delete shifts from published schedules

---

### Availability Endpoints

#### Get All Availability (Admin)
```
GET /api/schedules/:scheduleId/availability
```
**Purpose**: View all employee availability for schedule
**Auth Required**: Yes (admin or owner)
**Response**: `200 OK`
```json
[
  {
    "id": "avail-id",
    "employeeId": "emp-id",
    "scheduleId": "schedule-id",
    "dayOfWeek": "Monday",
    "status": "AVAILABLE",
    "startTime": "1970-01-01T17:00:00Z",
    "endTime": "1970-01-01T23:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "employee": {
      "id": "emp-id",
      "userId": "user-id",
      "user": {
        "id": "user-id",
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane@example.com"
      }
    }
  }
]
```

#### Get My Availability
```
GET /api/schedules/:scheduleId/availability/me
```
**Purpose**: View own availability for schedule
**Auth Required**: Yes (approved employee)
**Response**: `200 OK`
```json
[
  {
    "id": "avail-id",
    "employeeId": "emp-id",
    "scheduleId": "schedule-id",
    "dayOfWeek": "Monday",
    "status": "AVAILABLE",
    "startTime": "1970-01-01T17:00:00Z",
    "endTime": "1970-01-01T23:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

#### Submit Availability
```
POST /api/schedules/:scheduleId/availability
```
**Purpose**: Submit/update availability for the week
**Auth Required**: Yes (approved employee)
**Body**:
```json
{
  "availability": [
    {
      "dayOfWeek": "Monday",
      "status": "AVAILABLE",
      "startTime": "17:00",  // Optional
      "endTime": "23:00"     // Optional
    },
    {
      "dayOfWeek": "Tuesday",
      "status": "UNAVAILABLE"
    },
    {
      "dayOfWeek": "Friday",
      "status": "PREFERRED",
      "startTime": "18:00",
      "endTime": "00:00"
    }
  ]
}
```
**Response**: `201 Created`
```json
{
  "message": "Availability submitted successfully",
  "availability": [
    {
      "id": "avail-id",
      "employeeId": "emp-id",
      "scheduleId": "schedule-id",
      "dayOfWeek": "Monday",
      "status": "AVAILABLE",
      "startTime": "1970-01-01T17:00:00Z",
      "endTime": "1970-01-01T23:00:00Z",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```
**Notes**:
- Uses upsert pattern (can resubmit to update)
- Deadline enforced (cannot submit after deadline)
- Valid days: Monday-Sunday
- Valid statuses: AVAILABLE, UNAVAILABLE, PREFERRED
- Time format: "HH:MM" (24-hour)

#### Update Availability Entry
```
PATCH /api/availability/:id
```
**Purpose**: Update single availability entry
**Auth Required**: Yes (owner of entry or admin)
**Body**:
```json
{
  "status": "PREFERRED",  // Optional
  "startTime": "18:00",   // Optional
  "endTime": "00:00"      // Optional
}
```
**Response**: `200 OK`
```json
{
  "id": "avail-id",
  "employeeId": "emp-id",
  "scheduleId": "schedule-id",
  "dayOfWeek": "Monday",
  "status": "PREFERRED",
  "startTime": "1970-01-01T18:00:00Z",
  "endTime": "1970-01-01T00:00:00Z",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```
**Notes**: Deadline enforced for non-admins

#### Delete Availability Entry
```
DELETE /api/availability/:id
```
**Purpose**: Delete single availability entry
**Auth Required**: Yes (owner of entry or admin)
**Response**: `200 OK`
```json
{
  "message": "Availability deleted successfully"
}
```
**Notes**: Deadline enforced for non-admins

---

### Role (Job Position) Endpoints

#### List Roles
```
GET /api/organizations/:orgId/roles
```
**Purpose**: List all job roles in organization
**Auth Required**: Yes (approved employee)
**Response**: `200 OK`
```json
[
  {
    "id": "role-id",
    "organizationId": "org-id",
    "name": "Bartender",
    "createdAt": "2024-01-15T10:00:00Z",
    "_count": {
      "shifts": 15,
      "employeeAssignments": 5
    }
  }
]
```

#### Create Role
```
POST /api/organizations/:orgId/roles
```
**Purpose**: Create new job role
**Auth Required**: Yes (admin or owner)
**Body**:
```json
{
  "name": "Bartender"
}
```
**Response**: `201 Created`
```json
{
  "id": "role-id",
  "organizationId": "org-id",
  "name": "Bartender",
  "createdAt": "2024-01-15T10:00:00Z"
}
```
**Notes**: Role names must be unique within organization (max 100 chars)

#### Update Role
```
PATCH /api/roles/:id
```
**Purpose**: Update role name
**Auth Required**: Yes (admin or owner)
**Body**:
```json
{
  "name": "Lead Bartender"
}
```
**Response**: `200 OK` (same structure as Create)

#### Delete Role
```
DELETE /api/roles/:id
```
**Purpose**: Delete role
**Auth Required**: Yes (admin or owner)
**Response**: `200 OK`
```json
{
  "message": "Role deleted successfully"
}
```
**Notes**: Cannot delete roles assigned to any shifts

---

## TypeScript Type Definitions

All types are defined in `lastCall/types/api.ts`

### Enums
```typescript
export type EmployeeRole = 'OWNER' | 'ADMIN' | 'EMPLOYEE';
export type EmployeeStatus = 'PENDING' | 'APPROVED' | 'DENIED';
export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED';
```

### Base Models
```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  organizationId: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  requestedAt: string;
  approvedAt: string | null;
  createdAt: string;
}

export interface Schedule {
  id: string;
  organizationId: string;
  weekStartDate: string;
  availabilityDeadline: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDay {
  id: string;
  scheduleId: string;
  date: string;
  createdAt: string;
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  scheduleDayId: string;
  roleId: string;
  employeeId: string | null;
  startTime: string;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  id: string;
  employeeId: string;
  scheduleId: string;
  dayOfWeek: string;
  status: AvailabilityStatus;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeRoleAssignment {
  id: string;
  employeeId: string;
  roleId: string;
  createdAt: string;
}
```

### API Response Types
```typescript
export interface UserBasic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface OrganizationWithCounts extends Organization {
  owner: UserBasic;
  _count: {
    employees: number;
    schedules: number;
  };
}

export interface OrganizationDetail extends Organization {
  owner: UserBasic;
  employees: EmployeeWithUser[];
  roles: Role[];
  schedules: Schedule[];
}

export interface EmployeeWithUser extends Employee {
  user: UserBasic;
}

export interface ScheduleWithCounts extends Schedule {
  _count: {
    scheduleDays: number;
    availability: number;
  };
}

export interface ScheduleDetail extends Schedule {
  organization: {
    id: string;
    name: string;
    ownerId: string;
  };
  scheduleDays: ScheduleDayWithShifts[];
  availability: AvailabilityWithEmployee[];
}

export interface ScheduleDayWithShifts extends ScheduleDay {
  shifts: ShiftDetail[];
}

export interface ShiftDetail extends Shift {
  scheduleDay: {
    id: string;
    date: string;
  };
  role: {
    id: string;
    name: string;
  };
  employee: EmployeeWithUser | null;
}

export interface AvailabilityWithEmployee extends Availability {
  employee: EmployeeWithUser;
}

export interface RoleWithCounts extends Role {
  _count: {
    shifts: number;
    employeeAssignments: number;
  };
}

export interface EmployeeRoleAssignmentWithRole extends EmployeeRoleAssignment {
  role: Role;
}
```

### Request Types
```typescript
export interface CreateOrganizationRequest {
  name: string;
  description?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
}

export interface UpdateEmployeeRequest {
  status?: EmployeeStatus;
  role?: EmployeeRole;
}

export interface CreateScheduleRequest {
  weekStartDate: string;
  availabilityDeadline: string;
  operatingDays?: string[];
}

export interface CreateShiftRequest {
  roleId: string;
  startTime: string;
  endTime?: string;
  employeeId?: string;
}

export interface UpdateShiftRequest {
  startTime?: string;
  endTime?: string | null;
  roleId?: string;
  employeeId?: string;
}

export interface SubmitAvailabilityRequest {
  availability: Array<{
    dayOfWeek: string;
    status: AvailabilityStatus;
    startTime?: string;
    endTime?: string;
  }>;
}

export interface CreateUserRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AssignEmployeeRoleRequest {
  roleId: string;
}
```

---

## Frontend API Client

Location: `lastCall/lib/api.ts`

### Usage Example
```typescript
import { api } from '@/lib/api';

// Get current user
const user = await api.getCurrentUser();

// List organizations
const orgs = await api.getOrganizations();

// Create organization
const newOrg = await api.createOrganization({
  name: "Joe's Bar",
  description: "Downtown location"
});

// Get organization details
const org = await api.getOrganization('org-id');

// List employees
const employees = await api.getEmployees('org-id');

// Create invite link
const invite = await api.createInviteLink('org-id', 7);

// Join organization
const result = await api.joinOrganization('invite-token');

// Update employee
const updated = await api.updateEmployee('org-id', 'emp-id', {
  status: 'APPROVED'
});

// Assign role to employee
const assignment = await api.assignEmployeeRole('org-id', 'emp-id', 'role-id');

// List schedules
const schedules = await api.getSchedules('org-id');

// Get schedule details
const schedule = await api.getSchedule('schedule-id');

// Create schedule
const newSchedule = await api.createSchedule('org-id', {
  weekStartDate: '2024-01-22',
  availabilityDeadline: '2024-01-20',
  operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
});

// Create shift
const shift = await api.createShift('schedule-day-id', {
  roleId: 'role-id',
  startTime: '17:00',
  endTime: '23:00',
  employeeId: 'emp-id'
});

// Submit availability
const availability = await api.submitAvailability('schedule-id', {
  availability: [
    { dayOfWeek: 'Monday', status: 'AVAILABLE', startTime: '17:00', endTime: '23:00' },
    { dayOfWeek: 'Tuesday', status: 'UNAVAILABLE' }
  ]
});

// Get my availability
const myAvailability = await api.getMyAvailability('schedule-id');

// List roles
const roles = await api.getRoles('org-id');

// Create role
const role = await api.createRole('org-id', 'Bartender');
```

### Error Handling
```typescript
try {
  const org = await api.getOrganization('org-id');
} catch (error) {
  // Error messages from backend
  console.error(error.message);
  // Could be:
  // - "Organization not found"
  // - "Access denied"
  // - "HTTP 500"
  // - etc.
}
```

---

## Security Features

### Implemented
1. **JWT Authentication** - All protected routes require valid Supabase JWT token
2. **Rate Limiting** - 100 requests per 15 minutes per IP
3. **Helmet Security Headers** - Protects against common web vulnerabilities
4. **Request Body Size Limit** - 10MB max to prevent memory exhaustion
5. **Input Validation** - All text fields have length limits
6. **Environment Variable Validation** - Server validates required env vars on startup
7. **Expired Invite Link Cleanup** - Auto-deletes expired links when creating new ones
8. **Role-Based Access Control** - Owner/Admin/Employee permissions enforced
9. **Authorization Checks** - All routes verify user has access to resources
10. **Input Sanitization** - Email lowercase, text trimmed, validated formats

### Pending (for Production)
- **CORS Configuration** - Currently allows all origins (`origin: '*'`), need to restrict to frontend domain
- **HTTPS Enforcement** - Should redirect HTTP to HTTPS in production

---

## Current Implementation Status

### ✅ Completed

**Backend:**
- All API endpoints implemented and tested
- Authentication middleware working
- Authorization checks in place
- Security hardening complete
- Input validation on all endpoints
- Error handling implemented

**Frontend Foundation:**
- API client with all methods
- Complete TypeScript type definitions
- AuthContext managing authentication state
- Supabase integration configured
- Root layout with AuthProvider and PortalHost
- Authentication routing logic implemented in _layout.tsx

**Frontend UI - Completed Pages:**
- **Landing Page** (`app/index.tsx`) - Clean dark design with branding, "Get Started" and login CTAs
- **Login Screen** (`app/(auth)/login.tsx`) - Email/password form with proper validation and loading states
- **Sign Up Screen** (`app/(auth)/signup.tsx`) - Full registration form with firstName, lastName, email, password
- **Fork Page** (`app/(app)/forkPage.tsx`) - Smart routing page that shows:
  - Organization lobby (list of user's orgs) if they have memberships
  - Onboarding (join/create options) if they have no organizations
  - Fixed type issues (using `org._count.employees` instead of non-existent `org.role`)

**Design System Established:**
- **Color Palette:**
  - Primary background: `#020617` (Slate-950)
  - Secondary background: `#0f172a` (Slate-900)
  - Component background: `#1e293b` (Slate-800)
  - Borders: `#1e293b`, `#334155` (Slate-800/700)
  - Text: `#ffffff` (white), `#94a3b8` (Slate-400), `#64748b` (Slate-500)
  - Accent: `#818cf8` (Indigo-400), `#4f46e5` (Indigo-600), `#3b82f6` (Blue-500)
- **Typography:**
  - Large titles: 32-48px, fontWeight '700'
  - Subtitles: 16-20px, Slate-400
  - Labels: 14px, fontWeight '600', Slate-300
- **Components:**
  - Button/Input height: 56px
  - Border radius: 12-24px for cards/buttons
  - Padding: 24px horizontal standard
  - Consistent spacing with `gap` property
- **Patterns:**
  - SafeAreaView containers
  - KeyboardAvoidingView for forms
  - Loading states with ActivityIndicator
  - Error handling with Alert
  - Icons from lucide-react-native

### ⏳ In Progress

**Frontend UI - Navigation Structure:**
Creating placeholder pages for fork page navigation:
- `app/(app)/joinOrganization.tsx` - Page for entering invite code to join organization
- `app/(app)/createOrganization.tsx` - Form to create new organization
- `app/(app)/[orgId]/index.tsx` - Organization dashboard (dynamic route)

**Next Steps:**
1. Create the three placeholder pages above
2. Update navigation paths in forkPage.tsx to point to correct routes
3. Build out the organization dashboard
4. Implement create organization flow
5. Implement join organization flow

### 📋 Not Started
- Organization management screens
- Employee management screens
- Schedule creation and management
- Shift management
- Availability submission
- Role management
- State management for complex UI
- Offline support
- Push notifications
- Email notifications

---

## Frontend Development Guide

### Authentication Flow

Users should be **forced** to authenticate before accessing the app (not modals):

```
Unauthenticated → Auth Screens (Sign In/Sign Up)
                  ↓
Authenticated   → Main App (Dashboard, Organizations, Schedules, etc.)
```

### Suggested Screen Structure

```
App
├── (auth) - Unauthenticated users
│   ├── sign-in.tsx
│   └── sign-up.tsx
│
└── (app) - Authenticated users only
    ├── index.tsx                    # Dashboard/Home
    ├── organizations/
    │   ├── index.tsx                # List organizations
    │   ├── [id].tsx                 # Organization details
    │   ├── create.tsx               # Create organization
    │   └── [id]/
    │       ├── employees.tsx        # Manage employees
    │       ├── roles.tsx            # Manage job roles
    │       └── schedules/
    │           ├── index.tsx        # List schedules
    │           ├── [id].tsx         # View schedule
    │           ├── create.tsx       # Create schedule
    │           └── [id]/
    │               ├── availability.tsx  # Submit availability
    │               └── edit.tsx          # Edit shifts
    │
    └── invite/
        └── [token].tsx              # Join via invite link
```

### Key UI Components Needed

1. **Auth Forms**
   - Sign In form
   - Sign Up form
   - Error messages

2. **Organization Management**
   - Organization list card
   - Create organization form
   - Organization detail view
   - Edit organization form

3. **Employee Management**
   - Employee list with status badges (Pending/Approved/Denied)
   - Approve/Deny buttons
   - Role assignment selector
   - Invite link generator
   - Employee detail view

4. **Schedule Management**
   - Schedule list with week dates
   - Create schedule form with day selector
   - Calendar/grid view of schedule
   - Publish schedule button
   - Schedule status indicator

5. **Shift Management**
   - Shift card/row in schedule grid
   - Create shift form (role, time, employee)
   - Edit shift modal
   - Time pickers
   - Employee selector (filtered by role qualification)
   - "Until close" toggle for end time

6. **Availability**
   - Weekly availability form
   - Day-by-day status selector (Available/Unavailable/Preferred)
   - Time range inputs
   - Deadline countdown
   - Submission confirmation

7. **Role Management**
   - Role list
   - Create role form
   - Delete confirmation (if no shifts)
   - Role badge/chip component

8. **Common Components**
   - Loading states
   - Error states
   - Empty states
   - Toast notifications (success/error)
   - Confirmation dialogs
   - Action sheets
   - Date pickers
   - Time pickers
   - Dropdowns/selects

### User Roles & Permissions

**Owner:**
- Full access to organization
- Can delete organization
- Can manage all employees
- Can create/edit/delete schedules
- Can create/edit/delete shifts
- Can create/edit/delete roles

**Admin:**
- Can manage employees (approve/deny/assign roles)
- Can create/edit/delete schedules
- Can create/edit/delete shifts
- Can create/edit/delete roles
- Can view all availability
- Cannot delete organization

**Employee:**
- Can view schedules
- Can submit availability
- Can view own shifts
- Can view organization members
- Cannot manage others

### Data Flow Examples

#### Creating a Schedule
```typescript
// 1. User fills out form
const formData = {
  weekStartDate: '2024-01-22',
  availabilityDeadline: '2024-01-20',
  operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};

// 2. Call API
const schedule = await api.createSchedule(orgId, formData);

// 3. Navigate to schedule detail
router.push(`/organizations/${orgId}/schedules/${schedule.id}`);

// 4. Show success toast
toast.success('Schedule created successfully');
```

#### Approving an Employee
```typescript
// 1. User clicks "Approve" button
const handleApprove = async (employeeId: string) => {
  try {
    const updated = await api.updateEmployee(orgId, employeeId, {
      status: 'APPROVED'
    });

    // 2. Update local state
    setEmployees(prev =>
      prev.map(emp => emp.id === employeeId ? updated : emp)
    );

    // 3. Show success toast
    toast.success('Employee approved');
  } catch (error) {
    toast.error(error.message);
  }
};
```

#### Submitting Availability
```typescript
// 1. User selects availability for each day
const [availability, setAvailability] = useState([
  { dayOfWeek: 'Monday', status: 'AVAILABLE', startTime: '17:00', endTime: '23:00' },
  { dayOfWeek: 'Tuesday', status: 'UNAVAILABLE' },
  // ...
]);

// 2. User submits form
const handleSubmit = async () => {
  try {
    await api.submitAvailability(scheduleId, { availability });
    toast.success('Availability submitted');
    router.back();
  } catch (error) {
    toast.error(error.message);
  }
};
```

### Important Considerations

1. **Time Handling**
   - Backend stores times as UTC with reference date 1970-01-01
   - Frontend should display in local timezone
   - Use date-fns or dayjs for parsing/formatting

2. **Optimistic Updates**
   - Update UI immediately for better UX
   - Revert if API call fails
   - Show loading states for critical operations

3. **Error Handling**
   - Display user-friendly error messages
   - Log errors for debugging
   - Provide retry options for failed operations

4. **Offline Support (Future)**
   - Cache API responses
   - Queue mutations for retry
   - Show offline indicator

5. **Performance**
   - Paginate large lists
   - Lazy load routes
   - Optimize re-renders with React.memo
   - Use React Query or SWR for caching

---

## API Base URL Configuration

```typescript
const API_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'prod api end point';  // Update before production
```

**Important:** Update production API URL before deploying.

---

## Environment Variables Required

### Backend (.env)
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3000
NODE_ENV=development
FRONTEND_URL=exp://localhost:8081  # For invite links
```

### Frontend (.env)
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Common Workflows

### 1. Owner Creates Organization
1. Owner signs up/in
2. Navigates to "Create Organization"
3. Enters name and description
4. API creates org and employee record (role=OWNER, status=APPROVED)
5. Owner lands on organization detail page

### 2. Owner Invites Employees
1. Owner navigates to employees page
2. Clicks "Create Invite Link"
3. Sets expiration (1-30 days)
4. Shares link with new employee
5. New employee clicks link → joins org with status=PENDING
6. Owner approves/denies request

### 3. Admin Creates Schedule
1. Admin navigates to schedules
2. Clicks "Create Schedule"
3. Selects week start date, deadline, operating days
4. API creates schedule with schedule days
5. Admin can now add shifts to each day

### 4. Admin Creates Shifts
1. Admin opens schedule
2. Clicks "Add Shift" on a specific day
3. Selects role, start/end time, optional employee
4. If employee selected, validates they're qualified for role
5. Shift created and displayed on schedule

### 5. Employee Submits Availability
1. Employee sees unpublished schedule
2. Clicks "Submit Availability"
3. For each day, marks Available/Unavailable/Preferred with optional times
4. Submits before deadline
5. Admin can view all availability when assigning shifts

### 6. Admin Publishes Schedule
1. Admin reviews schedule and availability
2. Assigns employees to all shifts
3. Clicks "Publish Schedule"
4. Schedule becomes visible to all employees
5. Future: Triggers notifications

---

## Testing Checklist

When building UI, test these scenarios:

### Authentication
- [ ] Sign up with valid data
- [ ] Sign up with invalid email
- [ ] Sign up with existing email
- [ ] Sign in with valid credentials
- [ ] Sign in with invalid credentials
- [ ] Sign out
- [ ] Auto-login on app restart

### Organizations
- [ ] Create organization
- [ ] View organization list
- [ ] View organization details
- [ ] Update organization (owner only)
- [ ] Delete organization (owner only)
- [ ] Access control (non-members blocked)

### Employees
- [ ] Generate invite link
- [ ] Join via invite link
- [ ] Approve employee (admin)
- [ ] Deny employee (admin)
- [ ] Change employee role (admin)
- [ ] Remove employee (admin)
- [ ] Cannot modify owner

### Schedules
- [ ] Create schedule with all days
- [ ] Create schedule with custom days
- [ ] Add days to schedule
- [ ] Remove days (without shifts)
- [ ] Cannot remove days with shifts
- [ ] Update schedule dates
- [ ] Cannot update published schedule
- [ ] Publish schedule
- [ ] Delete schedule

### Shifts
- [ ] Create shift without employee
- [ ] Create shift with employee
- [ ] Create shift with "until close" (no end time)
- [ ] Employee qualification validation
- [ ] Update shift
- [ ] Delete shift
- [ ] Cannot modify published schedule shifts

### Availability
- [ ] Submit availability before deadline
- [ ] Cannot submit after deadline
- [ ] Update availability before deadline
- [ ] Admin can update anytime
- [ ] View all availability (admin)
- [ ] View own availability (employee)

### Roles
- [ ] Create role
- [ ] Update role name
- [ ] Delete unused role
- [ ] Cannot delete role with shifts
- [ ] Assign role to employee
- [ ] Remove role from employee

---

## Quick Reference

### HTTP Status Codes Used
- `200 OK` - Successful GET/PATCH/DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

### Common Validation Rules
- Organization name: 1-255 chars
- Organization description: 0-1000 chars
- Role name: 1-100 chars
- User first/last name: 1-100 chars
- Email: valid format, max 255 chars
- Invite expiration: 1-30 days
- Time format: "HH:MM" (24-hour)
- Day names: Monday-Sunday (exact case)
- Availability status: AVAILABLE | UNAVAILABLE | PREFERRED

---

## Design Reference for New Pages

When creating new pages, follow these established patterns from existing screens:

### Page Template Structure
```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconName } from 'lucide-react-native';

export default function PageName() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button if needed */}
      <View style={styles.header}>
        <Text style={styles.title}>Page Title</Text>
        <Text style={styles.subtitle}>Supporting description text.</Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Your content here */}
      </View>

      {/* Action button (if needed) */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAction}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#020617" />
        ) : (
          <Text style={styles.buttonText}>Action Text</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  button: {
    backgroundColor: '#4f46e5',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
```

### Component Patterns

**Input Field:**
```typescript
<View style={styles.inputGroup}>
  <Text style={styles.label}>Label Text</Text>
  <View style={styles.inputContainer}>
    <IconName size={20} color="#64748b" style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder="Placeholder..."
      placeholderTextColor="#64748b"
      value={value}
      onChangeText={setValue}
    />
  </View>
</View>

// Styles:
inputGroup: {
  gap: 8,
},
label: {
  fontSize: 14,
  fontWeight: '600',
  color: '#cbd5e1',
  marginLeft: 4,
},
inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#0f172a',
  borderWidth: 1,
  borderColor: '#1e293b',
  borderRadius: 12,
  height: 56,
  paddingHorizontal: 16,
},
inputIcon: {
  marginRight: 12,
},
input: {
  flex: 1,
  color: '#ffffff',
  fontSize: 16,
  height: '100%',
},
```

**Card/List Item:**
```typescript
<TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={handlePress}>
  <View style={styles.iconBubble}>
    <IconName size={24} color="#fff" />
  </View>
  <View style={styles.cardContent}>
    <Text style={styles.cardTitle}>Title</Text>
    <Text style={styles.cardDesc}>Description text</Text>
  </View>
  <ChevronRight size={20} color="#475569" />
</TouchableOpacity>

// Styles:
card: {
  backgroundColor: '#1e293b',
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#334155',
},
iconBubble: {
  width: 48,
  height: 48,
  borderRadius: 12,
  backgroundColor: '#3b82f6',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 16,
},
cardContent: {
  flex: 1,
},
cardTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#fff',
  marginBottom: 4,
},
cardDesc: {
  fontSize: 14,
  color: '#94a3b8',
},
```

**Primary Button (White on Dark):**
```typescript
button: {
  backgroundColor: '#ffffff',
  height: 56,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 8,
},
buttonText: {
  color: '#020617',
  fontSize: 16,
  fontWeight: '700',
},
```

**Secondary Button (Indigo):**
```typescript
button: {
  backgroundColor: '#4f46e5',
  height: 56,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 16,
  shadowColor: '#4f46e5',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 12,
  elevation: 4,
},
buttonText: {
  color: '#ffffff',
  fontSize: 16,
  fontWeight: '700',
},
```

### Color Variables (for quick reference)
```typescript
const colors = {
  // Backgrounds
  bg_primary: '#020617',    // Slate-950 - Main background
  bg_secondary: '#0f172a',  // Slate-900 - Input backgrounds
  bg_tertiary: '#1e293b',   // Slate-800 - Card backgrounds

  // Borders
  border_primary: '#1e293b',  // Slate-800
  border_secondary: '#334155', // Slate-700

  // Text
  text_primary: '#ffffff',    // White - Headings
  text_secondary: '#94a3b8',  // Slate-400 - Subtitles
  text_tertiary: '#64748b',   // Slate-500 - Descriptions
  text_label: '#cbd5e1',      // Slate-300 - Input labels
  text_muted: '#475569',      // Slate-600 - Footer text

  // Accents
  accent_primary: '#4f46e5',  // Indigo-600 - Primary buttons
  accent_secondary: '#818cf8', // Indigo-400 - Icons/highlights
  accent_info: '#3b82f6',     // Blue-500 - Info badges
  accent_success: '#34d399',  // Emerald-400 - Success states
};
```

### Icons Used
- `ArrowLeft` - Back buttons
- `Mail`, `Lock` - Auth forms
- `Plus` - Add/Create actions
- `QrCode` - Join organization
- `Building2` - Organizations
- `ChevronRight` - Navigation arrows
- `LogOut` - Sign out
- `Martini` - App logo

All icons from: `lucide-react-native`

---

This documentation should provide complete context for building the frontend UI. All backend APIs are implemented and ready to use. Focus on creating intuitive, mobile-first interfaces that leverage the existing API client and type definitions.
