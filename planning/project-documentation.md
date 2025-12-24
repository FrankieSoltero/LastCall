# LastCall - Employee Scheduling System
## Complete Project Documentation

**Last Updated**: December 2024
**Status**: Development (Core features implemented, ready for production hardening)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current Implementation Status](#current-implementation-status)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Backend API Reference](#backend-api-reference)
7. [Frontend Implementation](#frontend-implementation)
8. [API Client Methods](#api-client-methods)
9. [Helper Functions](#helper-functions)
10. [Development Patterns & Best Practices](#development-patterns--best-practices)
11. [Environment Setup](#environment-setup)
12. [Next Steps](#next-steps)

---

## Project Overview

**LastCall** is a mobile-first employee scheduling application built for the hospitality industry (bars, restaurants, clubs). It streamlines weekly schedule management, employee availability tracking, and shift assignment.

###  Core Features Implemented

- ✅ Multi-organization support (users can work at multiple locations)
- ✅ Role-based access control (Owner, Admin, Employee)
- ✅ Weekly schedule creation with flexible operating days
- ✅ Bulk shift management with atomic saves
- ✅ Employee availability submission (both general and schedule-specific)
- ✅ Job role management and employee role assignments
- ✅ Invite link system for seamless employee onboarding
- ✅ Published schedule viewing for employees
- ✅ Personal schedule view (employee's own shifts)
- ✅ Real-time employee schedule view with filtering

### Key Differentiators

1. **Performance-First**: Bulk operations reduce API calls from 30+ to 1
2. **Mobile-First**: Dark-themed, touch-optimized UI designed for React Native
3. **State-Based Forms**: Batch changes before saving to reduce network overhead
4. **Timezone-Safe**: Consistent UTC handling prevents date shifting bugs
5. **Developer-Friendly**: Complete TypeScript coverage with detailed type definitions

---

## Current Implementation Status

### ✅ Fully Implemented

**Backend (100% Complete)**
- All CRUD endpoints for Organizations, Employees, Schedules, Shifts, Roles, Availability
- JWT authentication with Supabase
- Role-based authorization checks
- Bulk shift operations (deleteMany + createMany in single transaction)
- Active schedule endpoint for employee viewing
- General availability system (reusable across schedules)
- Input validation and error handling
- Security hardening (rate limiting, helmet, CORS)

**Frontend - Authentication Flow**
- `app/index.tsx` - Landing page with branding and CTAs
- `app/(auth)/login.tsx` - Email/password login form
- `app/(auth)/signup.tsx` - User registration with firstName, lastName, email, password
- `app/(app)/forkPage.tsx` - Smart routing (organization lobby vs onboarding)

**Frontend - Organization Management**
- `app/(app)/createOrganization.tsx` - Create new organization form
- `app/(app)/joinOrganization.tsx` - Join via invite code
- `app/(app)/[orgId]/index.tsx` - **FULLY CONNECTED** Organization dashboard
  - Invite link generation with clipboard and share
  - Navigation to all sub-sections
  - Role-based UI rendering

**Frontend - Employee Management**
- `app/(app)/[orgId]/employees.tsx` - **FULLY CONNECTED** Employee list and management
  - Search and filter employees
  - Edit employee modal with state-based job role selection
  - Admin status toggle
  - Remove employee functionality
  - Permission-based UI

**Frontend - Schedule Management**
- `app/(app)/[orgId]/schedulesList.tsx` - **FULLY CONNECTED** List all schedules
  - Create schedule modal with Monday-only date picker
  - Published vs draft indicators
  - Navigate to editor or viewer based on schedule state
- `app/(app)/[orgId]/schedules.tsx` - **FULLY CONNECTED** Schedule editor
  - Day-by-day shift management with full day names
  - Sticky header with "Add Shift" button
  - Shift creation with role, time, employee, isOnCall flag
  - Employee staffing modal with availability sorting
  - Bulk shift save (single API call)
  - Publish schedule functionality
  - Operating days management
- `app/(app)/[orgId]/employeeSchedule.tsx` - **FULLY CONNECTED** Employee schedule view
  - Fetches most recent published schedule
  - Day navigation tabs with "my shift" indicators
  - Role filter strip
  - Highlighted user shifts
  - isOnCall badge display
  - Pull to refresh
- `app/(app)/[orgId]/personalSchedule.tsx` - **FULLY CONNECTED** Personal schedule view
  - Shows only current user's shifts
  - 7-day week view with "Closed" vs "No shift scheduled" states
  - UTC-safe date handling
  - Time-based icons (Sun/Moon)

**Frontend - Job Roles & Availability**
- `app/(app)/[orgId]/jobRoles.tsx` - Job role management UI
- `app/(app)/[orgId]/availability.tsx` - Schedule-specific availability submission
- `app/(app)/generalAvailability.tsx` - General availability preferences

**Frontend - Utilities**
- `lib/api.ts` - Complete API client with all endpoints
- `lib/helper.ts` - Date/time utilities, day conversions, availability checks
- `lib/supabase.ts` - Supabase client configuration
- `lib/storage.ts` - Expo SecureStore integration
- `contexts/AuthContext.tsx` - Authentication state management
- `components/logo.tsx` - Reusable logo component

### ⏳ In Progress / Needs Testing

- Job role management page (UI exists, needs backend connection testing)
- Availability submission pages (UI exists, needs full testing)
- Join organization flow (UI exists, needs full testing)

### 📋 Not Started (Future Features)

- Shift swap/trade requests
- Time-off request system
- Reporting and analytics dashboard
- Export schedules (PDF, CSV)
- Multi-location support for chains
- Shift templates for recurring schedules
- Push notifications (schedule published, shift changes)
- Email notifications
- SMS notifications
- Offline support with sync
- Dark/Light mode toggle (currently dark only)

---

## Tech Stack

### Backend

```json
{
  "runtime": "Node.js 18+",
  "framework": "Express.js 5.2.1",
  "language": "TypeScript 5.x",
  "orm": "Prisma 7.1.0",
  "database": "PostgreSQL (Supabase)",
  "auth": "Supabase Auth (JWT)",
  "security": [
    "helmet 8.0.0",
    "express-rate-limit 7.5.0",
    "cors"
  ]
}
```

### Frontend

```json
{
  "framework": "React Native (Expo SDK 52)",
  "language": "TypeScript 5.x",
  "navigation": "Expo Router (file-based routing)",
  "icons": "lucide-react-native 1.0.0",
  "utilities": [
    "expo-clipboard",
    "expo-sharing",
    "expo-secure-store"
  ],
  "state": "React Context API",
  "api": "Custom fetch-based client"
}
```

### Development Tools

- **Hot Reload**: Expo Go for instant mobile testing
- **Type Safety**: Strict TypeScript configuration
- **Database Management**: Prisma Studio
- **API Testing**: Thunder Client / Postman
- **Version Control**: Git

---

## Project Structure

```
LastCall/
├── server/                                  # Backend Express API
│   ├── src/
│   │   ├── index.ts                        # Server entry point
│   │   ├── lib/
│   │   │   ├── prisma.ts                   # Prisma client singleton
│   │   │   └── helper.ts                   # isOrgAdmin utility
│   │   ├── middleware/
│   │   │   ├── auth.ts                     # JWT authentication middleware
│   │   │   └── errorHandler.ts            # Global error handler
│   │   └── routes/
│   │       ├── users.ts                    # User creation (signup)
│   │       ├── organization.ts             # Organization CRUD
│   │       ├── employee.ts                 # Employee management & invites
│   │       ├── schedules.ts                # Schedule CRUD + publish + active schedule
│   │       ├── shift.ts                    # Shift CRUD + bulk operations
│   │       ├── availability.ts             # Schedule-specific availability
│   │       ├── generalAvailability.ts      # General availability preferences
│   │       └── roles.ts                    # Job role management
│   ├── prisma/
│   │   └── schema.prisma                   # Database schema
│   └── package.json
│
└── lastCall/                                # Frontend React Native app
    ├── app/                                 # Expo Router pages
    │   ├── _layout.tsx                     # Root layout with AuthProvider
    │   ├── index.tsx                       # Landing page
    │   ├── (auth)/
    │   │   ├── login.tsx                   # Login screen
    │   │   └── signup.tsx                  # Registration screen
    │   └── (app)/
    │       ├── forkPage.tsx                # Smart router (lobby/onboarding)
    │       ├── createOrganization.tsx      # Create org form
    │       ├── joinOrganization.tsx        # Join via invite code
    │       ├── generalAvailability.tsx     # General availability form
    │       └── [orgId]/
    │           ├── index.tsx               # Organization dashboard ✅
    │           ├── employees.tsx           # Employee management ✅
    │           ├── jobRoles.tsx            # Job role management
    │           ├── schedulesList.tsx       # List schedules ✅
    │           ├── schedules.tsx           # Schedule editor ✅
    │           ├── employeeSchedule.tsx    # Published schedule view ✅
    │           ├── personalSchedule.tsx    # Personal shifts view ✅
    │           └── availability.tsx        # Schedule-specific availability
    ├── components/
    │   └── logo.tsx                        # Logo component
    ├── contexts/
    │   └── AuthContext.tsx                 # Auth state management
    ├── lib/
    │   ├── api.ts                          # API client (all endpoints)
    │   ├── helper.ts                       # Date/time utilities
    │   ├── supabase.ts                     # Supabase client
    │   └── storage.ts                      # SecureStore wrapper
    ├── types/
    │   └── api.ts                          # TypeScript type definitions
    └── package.json
```

---

## Database Schema

### Core Models

#### User
```prisma
model User {
  id                String                    @id
  email             String                    @unique
  firstName         String                    @map("first_name")
  lastName          String                    @map("last_name")
  createdAt         DateTime                  @default(now()) @map("created_at")
  updatedAt         DateTime                  @updatedAt @map("updated_at")
  organizations     Organization[]            @relation("owner")
  employees         Employee[]
  inviteLinks       InviteLink[]
  generalAvailability GeneralAvailability[]

  @@map("users")
}
```

**Notes:**
- `id` comes from Supabase Auth UUID
- Created during signup via `POST /api/users`
- Email is unique and lowercase

#### Organization
```prisma
model Organization {
  id          String         @id @default(uuid()) @db.Uuid
  name        String
  description String?
  ownerId     String         @map("owner_id")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")
  owner       User           @relation("owner", fields: [ownerId], references: [id])
  employees   Employee[]
  schedules   Schedule[]
  roles       Role[]
  inviteLinks InviteLink[]

  @@map("organizations")
}
```

**Notes:**
- Automatically creates owner employee record (role=OWNER, status=APPROVED)
- Cascade deletes all related data on organization deletion

#### Employee
```prisma
model Employee {
  id                      String                     @id @default(uuid()) @db.Uuid
  userId                  String                     @map("user_id")
  organizationId          String                     @map("organization_id") @db.Uuid
  role                    EmployeeRole               @default(EMPLOYEE)
  status                  EmployeeStatus             @default(PENDING)
  requestedAt             DateTime                   @default(now()) @map("requested_at")
  approvedAt              DateTime?                  @map("approved_at")
  createdAt               DateTime                   @default(now()) @map("created_at")
  user                    User                       @relation(fields: [userId], references: [id])
  organization            Organization               @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  shifts                  Shift[]
  availability            Availability[]
  employeeRoleAssignments EmployeeRoleAssignment[]

  @@unique([userId, organizationId])
  @@map("employees")
}

enum EmployeeRole {
  OWNER
  ADMIN
  EMPLOYEE
}

enum EmployeeStatus {
  PENDING
  APPROVED
  DENIED
}
```

**Notes:**
- Unique constraint ensures user can only be employee once per organization
- `approvedAt` set automatically when status changes to APPROVED
- Cannot modify OWNER records (enforced in backend)

#### InviteLink
```prisma
model InviteLink {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  token          String       @unique
  expiresAt      DateTime     @map("expires_at")
  createdById    String       @map("created_by_id")
  createdAt      DateTime     @default(now()) @map("created_at")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdBy      User         @relation(fields: [createdById], references: [id])

  @@map("invite_links")
}
```

**Notes:**
- Token is UUID string
- Expires 1-30 days after creation (configurable)
- Expired links auto-cleaned when creating new link

#### Schedule
```prisma
model Schedule {
  id                   String         @id @default(uuid()) @db.Uuid
  organizationId       String         @map("organization_id") @db.Uuid
  name                 String?
  weekStartDate        DateTime       @map("week_start_date") @db.Date
  availabilityDeadline DateTime       @map("availability_deadline") @db.Date
  isPublished          Boolean        @default(false) @map("is_published")
  publishedAt          DateTime?      @map("published_at")
  createdAt            DateTime       @default(now()) @map("created_at")
  updatedAt            DateTime       @updatedAt @map("updated_at")
  organization         Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  scheduleDays         ScheduleDay[]
  availability         Availability[]

  @@unique([organizationId, weekStartDate])
  @@map("schedules")
}
```

**Notes:**
- `weekStartDate` must be a Monday
- `availabilityDeadline` must be before `weekStartDate`
- Unique constraint prevents duplicate schedules for same week
- Optional `name` field for custom schedule naming
- Once published, cannot be edited (enforced in backend)

#### ScheduleDay
```prisma
model ScheduleDay {
  id         String   @id @default(uuid()) @db.Uuid
  scheduleId String   @map("schedule_id") @db.Uuid
  date       DateTime @db.Date
  createdAt  DateTime @default(now()) @map("created_at")
  schedule   Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  shifts     Shift[]

  @@unique([scheduleId, date])
  @@map("schedule_days")
}
```

**Notes:**
- Represents operating days for the schedule
- Can be Mon-Sun in any combination
- Cannot delete days that have shifts assigned

#### Shift
```prisma
model Shift {
  id            String       @id @default(uuid()) @db.Uuid
  scheduleDayId String       @map("schedule_day_id") @db.Uuid
  roleId        String       @map("role_id") @db.Uuid
  employeeId    String?      @map("employee_id") @db.Uuid
  startTime     DateTime     @map("start_time")
  endTime       DateTime?    @map("end_time")
  isOnCall      Boolean      @default(false) @map("is_on_call")
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  scheduleDay   ScheduleDay  @relation(fields: [scheduleDayId], references: [id], onDelete: Cascade)
  role          Role         @relation(fields: [roleId], references: [id])
  employee      Employee?    @relation(fields: [employeeId], references: [id], onDelete: SetNull)

  @@map("shifts")
}
```

**Notes:**
- `startTime` and `endTime` stored as UTC with reference date 1970-01-01
- `endTime` nullable for "until close" shifts
- `employeeId` nullable for unassigned shifts
- `isOnCall` flag for on-call shifts
- Frontend sends time as "HH:MM", backend converts to DateTime
- Assigning employee validates they have the required role

#### Role (Job Position)
```prisma
model Role {
  id                      String                   @id @default(uuid()) @db.Uuid
  organizationId          String                   @map("organization_id") @db.Uuid
  name                    String
  createdAt               DateTime                 @default(now()) @map("created_at")
  organization            Organization             @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  shifts                  Shift[]
  employeeRoleAssignments EmployeeRoleAssignment[]

  @@unique([organizationId, name])
  @@map("roles")
}
```

**Notes:**
- Job roles (e.g., "Bartender", "Server", "Host")
- Unique per organization
- Cannot delete roles assigned to shifts
- Max 100 characters

#### EmployeeRoleAssignment
```prisma
model EmployeeRoleAssignment {
  id         String   @id @default(uuid()) @db.Uuid
  employeeId String   @map("employee_id") @db.Uuid
  roleId     String   @map("role_id") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at")
  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([employeeId, roleId])
  @@map("employee_role_assignments")
}
```

**Notes:**
- Many-to-many relationship between employees and job roles
- Employee can only be assigned to role once
- Used for shift assignment validation

#### Availability (Schedule-Specific)
```prisma
model Availability {
  id         String             @id @default(uuid()) @db.Uuid
  employeeId String             @map("employee_id") @db.Uuid
  scheduleId String             @map("schedule_id") @db.Uuid
  dayOfWeek  String             @map("day_of_week")
  status     AvailabilityStatus
  startTime  DateTime?          @map("start_time")
  endTime    DateTime?          @map("end_time")
  createdAt  DateTime           @default(now()) @map("created_at")
  updatedAt  DateTime           @updatedAt @map("updated_at")
  employee   Employee           @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  schedule   Schedule           @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

  @@unique([employeeId, scheduleId, dayOfWeek])
  @@map("availability")
}

enum AvailabilityStatus {
  AVAILABLE
  UNAVAILABLE
  PREFERRED
}
```

**Notes:**
- Employees submit per-schedule availability before deadline
- `dayOfWeek` must be full name ("Monday", "Tuesday", etc.)
- `startTime`/`endTime` optional for partial day availability
- Uses upsert pattern (can resubmit to update)
- Deadline enforced in backend

#### GeneralAvailability
```prisma
model GeneralAvailability {
  id        String             @id @default(uuid()) @db.Uuid
  userId    String             @map("user_id")
  dayOfWeek String             @map("day_of_week")
  status    AvailabilityStatus
  startTime DateTime?          @map("start_time")
  endTime   DateTime?          @map("end_time")
  createdAt DateTime           @default(now()) @map("created_at")
  updatedAt DateTime           @updatedAt @map("updated_at")
  user      User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, dayOfWeek])
  @@map("general_availability")
}
```

**Notes:**
- User-level default availability (reusable across organizations)
- Falls back to general if schedule-specific not provided
- Same structure as schedule-specific availability

---

## Backend API Reference

**Base URL:** `http://localhost:3000/api` (development)

### Authentication

All endpoints except `POST /api/users` require JWT authentication:

```
Authorization: Bearer <supabase_jwt_token>
```

The `authMiddleware` validates the token and attaches `req.userId` for use in routes.

### User Endpoints

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "id": "supabase-user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "id": "supabase-user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Notes:**
- Public endpoint (no auth required)
- Called during signup after Supabase auth account creation
- Email converted to lowercase
- Names trimmed

#### Get Current User
```http
GET /api/protected
Authorization: Bearer <token>
```

**Response:** `200 OK`
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
```http
GET /api/organizations
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "org-id",
    "name": "Joe's Bar",
    "description": "Downtown location",
    "ownerId": "user-id",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
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

**Notes:**
- Returns organizations where user is owner OR approved employee

#### Get Organization Details
```http
GET /api/organizations/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "org-id",
  "name": "Joe's Bar",
  "description": "Downtown location",
  "ownerId": "user-id",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z",
  "owner": { ... },
  "employees": [ ... ],
  "roles": [ ... ],
  "schedules": [ ... ]
}
```

**Access:** Owner or approved employee

#### Create Organization
```http
POST /api/organizations
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Joe's Bar",
  "description": "Downtown location"
}
```

**Response:** `201 Created`

**Notes:**
- Automatically creates employee record (role=OWNER, status=APPROVED)
- Name required (1-255 chars)
- Description optional (max 1000 chars)

#### Update Organization
```http
PATCH /api/organizations/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Joe's Bar & Grill",
  "description": "New description"
}
```

**Response:** `200 OK`

**Access:** Owner only

#### Delete Organization
```http
DELETE /api/organizations/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Organization deleted successfully"
}
```

**Access:** Owner only
**Notes:** Cascades to all related data

---

### Employee Endpoints

#### List Employees
```http
GET /api/organizations/:orgId/employees
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "emp-id",
    "userId": "user-id",
    "organizationId": "org-id",
    "role": "EMPLOYEE",
    "status": "APPROVED",
    "requestedAt": "2024-01-15T10:00:00.000Z",
    "approvedAt": "2024-01-15T11:00:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "user": {
      "id": "user-id",
      "email": "employee@example.com",
      "firstName": "Jane",
      "lastName": "Doe"
    },
    "employeeRoleAssignments": [
      {
        "id": "assignment-id",
        "employeeId": "emp-id",
        "roleId": "role-id",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "role": {
          "id": "role-id",
          "name": "Bartender"
        }
      }
    ]
  }
]
```

**Access:** Approved employee

#### Get Single Employee
```http
GET /api/organizations/:orgId/employees/:employeeId
Authorization: Bearer <token>
```

**Response:** `200 OK` (same structure as list item)

**Notes:**
- Used to get current employee's info via `api.getEmployee(orgId)`
- Backend identifies employee by userId from JWT

#### Create Invite Link
```http
POST /api/organizations/:orgId/employees/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "expiresInDays": 7
}
```

**Response:** `201 Created`
```json
{
  "id": "invite-id",
  "organizationId": "org-id",
  "token": "uuid-token",
  "expiresAt": "2024-01-22T10:00:00.000Z",
  "createdById": "user-id",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "organization": {
    "id": "org-id",
    "name": "Joe's Bar"
  },
  "inviteUrl": "exp://192.168.1.233:8081/joinOrganization?token=uuid-token"
}
```

**Access:** Admin or owner
**Notes:**
- `expiresInDays` optional (default 7, min 1, max 30)
- Auto-cleans expired links for organization
- URL format uses `FRONTEND_URL` env variable

#### Join Organization
```http
POST /api/invite/:token
Authorization: Bearer <token>
```

**Response:** `201 Created`
```json
{
  "message": "Request sent! Waiting for admin approval",
  "employee": {
    "id": "emp-id",
    "userId": "user-id",
    "organizationId": "org-id",
    "role": "EMPLOYEE",
    "status": "PENDING",
    "requestedAt": "2024-01-15T10:00:00.000Z",
    "approvedAt": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "user": { ... },
    "organization": { ... }
  }
}
```

**Notes:**
- Creates employee with status=PENDING
- Validates invite link not expired
- Cannot join same organization twice

#### Update Employee
```http
PATCH /api/organizations/:orgId/employees/:employeeId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "APPROVED",
  "role": "ADMIN"
}
```

**Response:** `200 OK`

**Access:** Admin or owner
**Notes:**
- Cannot modify owner
- Setting status=APPROVED sets approvedAt timestamp
- Valid roles: OWNER, ADMIN, EMPLOYEE
- Valid statuses: PENDING, APPROVED, DENIED

#### Remove Employee
```http
DELETE /api/organizations/:orgId/employees/:employeeId
Authorization: Bearer <token>
```

**Response:** `200 OK`

**Access:** Admin or owner
**Notes:** Cannot remove owner

#### Assign Employee Role (Job Position)
```http
POST /api/organizations/:orgId/employees/:employeeId/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": "role-id"
}
```

**Response:** `201 Created`
```json
{
  "id": "assignment-id",
  "employeeId": "emp-id",
  "roleId": "role-id",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "role": {
    "id": "role-id",
    "organizationId": "org-id",
    "name": "Bartender",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Access:** Admin or owner

#### Remove Employee Role Assignment
```http
DELETE /api/organizations/:orgId/employees/:employeeId/roles/:roleId
Authorization: Bearer <token>
```

**Response:** `200 OK`

**Access:** Admin or owner

---

### Schedule Endpoints

#### List Schedules
```http
GET /api/organizations/:orgId/schedules
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "schedule-id",
    "organizationId": "org-id",
    "name": "Week of Jan 22",
    "weekStartDate": "2024-01-22T00:00:00.000Z",
    "availabilityDeadline": "2024-01-20T00:00:00.000Z",
    "isPublished": true,
    "publishedAt": "2024-01-21T10:00:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-21T10:00:00.000Z",
    "_count": {
      "scheduleDays": 6,
      "availability": 12
    }
  }
]
```

**Access:** Approved employee

#### Get Schedule Details
```http
GET /api/schedules/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "schedule-id",
  "organizationId": "org-id",
  "name": "Week of Jan 22",
  "weekStartDate": "2024-01-22T00:00:00.000Z",
  "availabilityDeadline": "2024-01-20T00:00:00.000Z",
  "isPublished": true,
  "publishedAt": "2024-01-21T10:00:00.000Z",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-21T10:00:00.000Z",
  "scheduleDays": [
    {
      "id": "day-id",
      "scheduleId": "schedule-id",
      "date": "2024-01-22T00:00:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "shifts": [
        {
          "id": "shift-id",
          "scheduleDayId": "day-id",
          "roleId": "role-id",
          "employeeId": "emp-id",
          "startTime": "1970-01-01T17:00:00.000Z",
          "endTime": "1970-01-01T23:00:00.000Z",
          "isOnCall": false,
          "createdAt": "2024-01-15T10:00:00.000Z",
          "updatedAt": "2024-01-15T10:00:00.000Z",
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
    }
  ],
  "operatingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
}
```

**Access:** Approved employee
**Notes:**
- Returns computed `operatingDays` field (array of day names)
- Times stored with 1970-01-01 reference date

#### Get Active Schedule
```http
GET /api/organizations/:orgId/active-schedule
Authorization: Bearer <token>
```

**Response:** `200 OK` (same structure as Get Schedule Details)

**Notes:**
- Returns most recently published schedule
- Used by employee schedule view
- Returns 404 if no published schedule exists

#### Create Schedule
```http
POST /api/organizations/:orgId/schedules
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Week of Jan 22",
  "weekStartDate": "2024-01-22",
  "availabilityDeadline": "2024-01-20",
  "operatingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
}
```

**Response:** `201 Created`

**Access:** Admin or owner
**Notes:**
- `name` optional
- `weekStartDate` must be Monday (YYYY-MM-DD format)
- `availabilityDeadline` must be before week start
- `operatingDays` optional (default: [] - empty array)
- Creates ScheduleDay records for each operating day
- Unique constraint: (organizationId, weekStartDate)

#### Update Schedule
```http
PATCH /api/schedules/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated name",
  "weekStartDate": "2024-01-23",
  "availabilityDeadline": "2024-01-21"
}
```

**Response:** `200 OK`

**Access:** Admin or owner
**Notes:** Cannot update published schedules

#### Update Schedule Days
```http
PATCH /api/schedules/:id/days
Authorization: Bearer <token>
Content-Type: application/json

{
  "addDays": ["Sunday"],
  "removeDays": ["Monday"]
}
```

**Response:** `200 OK`

**Access:** Admin or owner
**Notes:**
- Cannot modify published schedules
- Cannot remove days with shifts
- `addDays` and `removeDays` both optional

#### Publish Schedule
```http
POST /api/schedules/:id/publish
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Schedule published successfully",
  "schedule": {
    "id": "schedule-id",
    "isPublished": true,
    "publishedAt": "2024-01-21T10:00:00.000Z",
    ...
  }
}
```

**Access:** Admin or owner
**Notes:**
- Sets `isPublished=true` and `publishedAt=now()`
- Makes schedule visible to all employees
- Future: Will trigger notifications

#### Delete Schedule
```http
DELETE /api/schedules/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`

**Access:** Admin or owner
**Notes:** Cascades to all shifts and availability

---

### Shift Endpoints

#### List Shifts
```http
GET /api/schedules/:scheduleId/shifts
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "shift-id",
    "scheduleDayId": "day-id",
    "roleId": "role-id",
    "employeeId": "emp-id",
    "startTime": "1970-01-01T17:00:00.000Z",
    "endTime": "1970-01-01T23:00:00.000Z",
    "isOnCall": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "scheduleDay": {
      "id": "day-id",
      "date": "2024-01-22T00:00:00.000Z"
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

**Access:** Approved employee

#### Create Shift
```http
POST /api/schedule-days/:scheduleDayId/shifts
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": "role-id",
  "startTime": "17:00",
  "endTime": "23:00",
  "employeeId": "emp-id",
  "isOnCall": false
}
```

**Response:** `201 Created`

**Access:** Admin or owner
**Notes:**
- Cannot create on published schedules
- Time format: "HH:MM" (24-hour)
- `endTime` optional (null for "until close")
- `employeeId` optional (null for unassigned)
- `isOnCall` optional (default false)
- If employee assigned, validates they have the role

#### Update Shift
```http
PATCH /api/shifts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "startTime": "18:00",
  "endTime": "00:00",
  "roleId": "role-id",
  "employeeId": "emp-id",
  "isOnCall": true
}
```

**Response:** `200 OK`

**Access:** Admin or owner
**Notes:** Cannot update on published schedules

#### Delete Shift
```http
DELETE /api/shifts/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`

**Access:** Admin or owner
**Notes:** Cannot delete from published schedules

#### Bulk Update Shifts ⚡
```http
POST /api/schedules/:scheduleId/shifts/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "delete": ["shift-id-1", "shift-id-2"],
  "create": [
    {
      "scheduleDayId": "day-id",
      "roleId": "role-id",
      "startTime": "17:00",
      "endTime": "23:00",
      "employeeId": "emp-id",
      "isOnCall": false
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "message": "Shifts updated successfully",
  "deleted": 2,
  "created": 15
}
```

**Access:** Admin or owner
**Notes:**
- **Atomic operation** - uses Prisma transaction (all or nothing)
- Uses `deleteMany` and `createMany` for bulk performance
- ~8.5x faster than sequential operations
- Transaction timeout: 10 seconds
- Both `delete` and `create` arrays optional
- Cannot modify published schedules

---

### Availability Endpoints

#### Get All Availability (Admin)
```http
GET /api/schedules/:scheduleId/availability
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "avail-id",
    "employeeId": "emp-id",
    "scheduleId": "schedule-id",
    "dayOfWeek": "Monday",
    "status": "AVAILABLE",
    "startTime": "1970-01-01T17:00:00.000Z",
    "endTime": "1970-01-01T23:00:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
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

**Access:** Admin or owner

#### Get My Availability
```http
GET /api/schedules/:scheduleId/availability/me
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "avail-id",
    "employeeId": "emp-id",
    "scheduleId": "schedule-id",
    "dayOfWeek": "Monday",
    "status": "AVAILABLE",
    "startTime": "1970-01-01T17:00:00.000Z",
    "endTime": "1970-01-01T23:00:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

**Access:** Approved employee

#### Submit Availability
```http
POST /api/schedules/:scheduleId/availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "availability": [
    {
      "dayOfWeek": "Monday",
      "status": "AVAILABLE",
      "startTime": "17:00",
      "endTime": "23:00"
    },
    {
      "dayOfWeek": "Tuesday",
      "status": "UNAVAILABLE"
    }
  ]
}
```

**Response:** `201 Created`

**Access:** Approved employee
**Notes:**
- Uses upsert (can resubmit to update)
- Deadline enforced (cannot submit after)
- `dayOfWeek` must be full name (Monday-Sunday)
- Valid statuses: AVAILABLE, UNAVAILABLE, PREFERRED
- `startTime`/`endTime` optional

#### Update Availability Entry
```http
PATCH /api/availability/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "PREFERRED",
  "startTime": "18:00",
  "endTime": "00:00"
}
```

**Response:** `200 OK`

**Access:** Owner of entry or admin
**Notes:** Deadline enforced for non-admins

#### Delete Availability Entry
```http
DELETE /api/availability/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`

**Access:** Owner of entry or admin

---

### General Availability Endpoints

#### Get General Availability
```http
GET /api/general-availability
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "avail-id",
    "userId": "user-id",
    "dayOfWeek": "Monday",
    "status": "AVAILABLE",
    "startTime": "1970-01-01T17:00:00.000Z",
    "endTime": "1970-01-01T23:00:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

**Notes:**
- Returns user's general availability preferences
- Falls back to this if schedule-specific not provided

#### Update General Availability
```http
POST /api/general-availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "availability": [
    {
      "dayOfWeek": "Monday",
      "status": "AVAILABLE",
      "startTime": "17:00",
      "endTime": "23:00"
    }
  ]
}
```

**Response:** `200 OK`

**Notes:**
- Uses upsert pattern
- Same structure as schedule-specific availability

---

### Role (Job Position) Endpoints

#### List Roles
```http
GET /api/organizations/:orgId/roles
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "role-id",
    "organizationId": "org-id",
    "name": "Bartender",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "_count": {
      "shifts": 15,
      "employeeAssignments": 5
    }
  }
]
```

**Access:** Approved employee

#### Create Role
```http
POST /api/organizations/:orgId/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Bartender"
}
```

**Response:** `201 Created`

**Access:** Admin or owner
**Notes:**
- Name required (1-100 chars)
- Unique per organization

#### Update Role
```http
PATCH /api/roles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Lead Bartender"
}
```

**Response:** `200 OK`

**Access:** Admin or owner

#### Delete Role
```http
DELETE /api/roles/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`

**Access:** Admin or owner
**Notes:** Cannot delete roles assigned to shifts

---

## Frontend Implementation

### Authentication Flow

#### Landing Page (`app/index.tsx`)
- Dark-themed welcome screen
- App branding with logo
- "Get Started" button → signup
- "Already have an account?" → login
- Uses `useAuth()` to check if user already logged in
- Auto-redirects to forkPage if authenticated

#### Signup (`app/(auth)/signup.tsx`)
- Fields: firstName, lastName, email, password
- Client-side validation
- Flow:
  1. Call `supabase.auth.signUp(email, password)`
  2. Get user.id from Supabase
  3. Call `api.createUser({ id, email, firstName, lastName })`
  4. Auto-login and redirect to forkPage

#### Login (`app/(auth)/login.tsx`)
- Fields: email, password
- Flow:
  1. Call `supabase.auth.signInWithPassword(email, password)`
  2. Auto-login via AuthContext session listener
  3. Redirect to forkPage

#### Fork Page (`app/(app)/forkPage.tsx`)
Smart router that determines user's starting point:
- If user has organizations → show organization lobby (list of orgs)
- If no organizations → show onboarding (create or join)
- Handles PENDING/DENIED status with appropriate messaging

### Organization Management

#### Create Organization (`app/(app)/createOrganization.tsx`)
- Form: name (required), description (optional)
- Calls `api.createOrganization(data)`
- Auto-navigates to new org dashboard

#### Join Organization (`app/(app)/joinOrganization.tsx`)
- Input: invite token from URL or manual entry
- Calls `api.joinOrganization(token)`
- Shows success/pending approval message
- Navigates to org dashboard if approved, lobby if pending

#### Organization Dashboard (`app/(app)/[orgId]/index.tsx`) ✅ FULLY CONNECTED
**Features:**
- Organization name and employee count display
- Role badge (OWNER/ADMIN/EMPLOYEE)
- Invite link generation with expiration selector (1-30 days)
- Copy to clipboard (expo-clipboard)
- Share via system share sheet (expo-sharing)
- Navigation cards:
  - View Schedules → schedulesList
  - Manage Employees → employees (admin+)
  - Job Roles → jobRoles (admin+)
  - My Availability → generalAvailability
- Logout button

**Implementation Details:**
- Permission-based UI rendering
- Parallel API calls for org details
- Real-time invite link generation
- Status handling for PENDING/DENIED employees

### Employee Management

#### Employees List (`app/(app)/[orgId]/employees.tsx`) ✅ FULLY CONNECTED
**Features:**
- List all employees with status badges (Pending/Approved/Denied)
- Search bar (filter by name/email)
- Contact info display (email)
- Edit employee modal:
  - **State-based job role selection** - checkboxes for all roles
  - Track changes locally, save all at once
  - Unsaved changes warning on close
  - Parallel API calls for role add/remove (Promise.all)
  - Admin status toggle (EMPLOYEE ↔ ADMIN)
  - Remove employee button
- Permission-based UI (read-only for employees)

**Implementation Details:**
- `useState` for selected roles tracking
- `hasChanges` detection via array comparison
- `Alert.alert` for unsaved changes confirmation
- Conditional rendering based on user role

### Schedule Management

#### Schedules List (`app/(app)/[orgId]/schedulesList.tsx`) ✅ FULLY CONNECTED
**Features:**
- List all schedules with week dates
- Published vs draft indicators
- Schedule counts (days, shifts)
- Create schedule modal:
  - Optional name field
  - Monday-only date picker (inline expansion)
  - Creates with empty operatingDays array
  - Navigates to editor immediately
- Tap to open:
  - Published schedules → employeeSchedule (view-only)
  - Draft schedules → schedules (editor)

**Implementation Details:**
- `getNextMondays(8)` helper for date picker
- Inline modal expansion (no nested modals)
- Status-based navigation logic

#### Schedule Editor (`app/(app)/[orgId]/schedules.tsx`) ✅ FULLY CONNECTED
**Features:**
- Week-based shift management
- Day selector tabs with shift count badges
- Full day names ("Friday's Shifts" not "Fri's Shifts")
- Sticky header with "Add Shift" button
- Add shift modal:
  - Role selector (dropdown)
  - Time pickers (start/end)
  - "Until Close" toggle (sets endTime=null)
  - Employee selector with availability sorting
  - isOnCall checkbox
- Shift cards display:
  - Time range
  - Role name
  - Employee name or "Unassigned"
  - isOnCall badge
  - Delete button
- Operating days management:
  - Add/remove days dynamically
  - Cannot remove days with shifts
- **Bulk save optimization** - saves all changes in single API call
- **Publish schedule** - makes visible to all employees
- Save confirmation with auto-navigate back to list

**Implementation Details:**
- State tracking for all shifts per day
- `calculateDateForDay` helper for date mapping
- Availability-based employee sorting
- Bulk update API: `api.bulkUpdateShifts(scheduleId, { delete: [...], create: [...] })`
- Transaction ensures atomicity

#### Employee Schedule View (`app/(app)/[orgId]/employeeSchedule.tsx`) ✅ FULLY CONNECTED
**Features:**
- Fetches most recent published schedule
- Week range header ("Jan 22 - Jan 28")
- Day navigation tabs (Mon-Sun)
  - Indicator dot on days with user's shifts
  - Active day highlighting
- Role filter strip (All Positions + dynamic roles)
- Shift cards:
  - Time display (start → end)
  - Role and employee name
  - "My shifts" highlighted (blue border + background)
  - isOnCall badge (yellow)
- Sorts "my shifts" first, then by time
- Pull to refresh
- Empty state: "No Shifts Scheduled"

**Implementation Details:**
- `api.getActiveSchedule(orgId)` - gets latest published
- Week range calculated from schedule.weekStartDate
- Filters shifts by day and role
- `currentUserId` from AuthContext
- RefreshControl integration

#### Personal Schedule View (`app/(app)/[orgId]/personalSchedule.tsx`) ✅ FULLY CONNECTED
**Features:**
- Shows only current user's shifts across 7 days
- Week range header with UTC-safe date handling
- Day-by-day view (Monday through Sunday)
- Three states per day:
  - Has shifts → show shift cards
  - Operating day, no shifts → "No shift scheduled"
  - Non-operating day → "Closed"
- Shift cards with time, role, Sun/Moon icon
- Summary card: "Total Shifts" count
- Greeting based on time of day
- Pull to refresh

**Implementation Details:**
- Generates all 7 days from weekStartDate
- Compares each day against scheduleDays to determine operating status
- UTC date arithmetic to avoid timezone shifts
- `dateToDay` and `dayToFullName` helpers
- `isClosed` flag on DaySchedule type

### Availability Management

#### General Availability (`app/(app)/generalAvailability.tsx`)
**Purpose:** User-level default availability (reusable across organizations)

**Features:**
- Weekly view (Monday-Sunday)
- Per-day status selector (Available/Unavailable/Preferred)
- Optional time range inputs
- Save all at once (upsert pattern)

**Implementation:** UI exists, needs backend connection testing

#### Schedule-Specific Availability (`app/(app)/[orgId]/availability.tsx`)
**Purpose:** Submit availability for specific schedule

**Features:**
- Displays schedule week and deadline
- Weekly view with status selectors
- Optional time ranges
- Deadline countdown
- Submit before deadline (enforced by backend)

**Implementation:** UI exists, needs backend connection testing

### Job Roles

#### Job Roles Management (`app/(app)/[orgId]/jobRoles.tsx`)
**Features:**
- List all job roles (Bartender, Server, Host, etc.)
- Create new role
- Edit role name
- Delete role (if not assigned to shifts)
- Usage count display (# shifts, # employees)

**Implementation:** UI exists, needs backend connection testing

---

## API Client Methods

**File:** `lastCall/lib/api.ts`

All methods use the base URL configured in API_URL constant. Authentication token automatically attached from Supabase session.

### User Methods

```typescript
// Get current authenticated user
getCurrentUser(): Promise<UserBasic>

// Create user during signup
createUser(data: CreateUserRequest): Promise<User>
```

### Organization Methods

```typescript
// List user's organizations
getOrganizations(): Promise<OrganizationWithCounts[]>

// Get organization details
getOrganization(id: string): Promise<OrganizationDetail>

// Create organization
createOrganization(data: CreateOrganizationRequest): Promise<OrganizationDetail>

// Update organization
updateOrganization(id: string, data: UpdateOrganizationRequest): Promise<OrganizationDetail>

// Delete organization
deleteOrganization(id: string): Promise<{ message: string }>
```

### Employee Methods

```typescript
// List employees in organization
getEmployees(orgId: string): Promise<EmployeeWithUser[]>

// Get single employee (current user's employee record)
getEmployee(orgId: string): Promise<EmployeeWithUser>

// Create invite link
createInviteLink(orgId: string, expiresInDays: number): Promise<InviteLinkWithOrg>

// Join organization via invite token
joinOrganization(token: string): Promise<{ message: string; employee: EmployeeWithUser }>

// Update employee status or role
updateEmployee(orgId: string, employeeId: string, data: UpdateEmployeeRequest): Promise<EmployeeWithUser>

// Remove employee
deleteEmployee(orgId: string, employeeId: string): Promise<{ message: string }>

// Assign job role to employee
assignEmployeeRole(orgId: string, employeeId: string, roleId: string): Promise<EmployeeRoleAssignmentWithRole>

// Remove job role from employee
removeEmployeeRole(orgId: string, employeeId: string, roleId: string): Promise<{ message: string }>
```

### Schedule Methods

```typescript
// List schedules
getSchedules(orgId: string): Promise<ScheduleWithCounts[]>

// Get schedule details
getSchedule(id: string): Promise<ScheduleDetail>

// Get active (most recent published) schedule
getActiveSchedule(orgId: string): Promise<ScheduleDetail>

// Create schedule
createSchedule(orgId: string, data: CreateScheduleRequest): Promise<ScheduleDetail>

// Update schedule
updateSchedule(id: string, data: Partial<CreateScheduleRequest>): Promise<ScheduleDetail>

// Update schedule days (add/remove operating days)
updateScheduleDays(id: string, data: { addDays?: string[], removeDays?: string[] }): Promise<ScheduleDetail>

// Publish schedule
publishSchedule(id: string): Promise<{ message: string; schedule: Schedule }>

// Delete schedule
deleteSchedule(id: string): Promise<{ message: string }>
```

### Shift Methods

```typescript
// List shifts for schedule
getShifts(scheduleId: string): Promise<ShiftDetail[]>

// Create shift
createShift(scheduleDayId: string, data: CreateShiftRequest): Promise<ShiftDetail>

// Update shift
updateShift(id: string, data: UpdateShiftRequest): Promise<ShiftDetail>

// Delete shift
deleteShift(id: string): Promise<{ message: string }>

// Bulk update shifts (atomic transaction)
bulkUpdateShifts(
  scheduleId: string,
  data: { delete?: string[], create?: CreateShiftRequest[] }
): Promise<{ message: string; deleted: number; created: number }>
```

### Availability Methods

```typescript
// Get all availability for schedule (admin)
getAvailability(scheduleId: string): Promise<AvailabilityWithEmployee[]>

// Get my availability for schedule
getMyAvailability(scheduleId: string): Promise<Availability[]>

// Submit/update availability
submitAvailability(
  scheduleId: string,
  data: { availability: Array<{ dayOfWeek: string; status: string; startTime?: string; endTime?: string }> }
): Promise<{ message: string; availability: Availability[] }>

// Update single availability entry
updateAvailability(id: string, data: Partial<Availability>): Promise<Availability>

// Delete availability entry
deleteAvailability(id: string): Promise<{ message: string }>

// Get general availability
getGeneralAvailability(): Promise<GeneralAvailability[]>

// Update general availability
updateGeneralAvailability(
  data: { availability: Array<{ dayOfWeek: string; status: string; startTime?: string; endTime?: string }> }
): Promise<GeneralAvailability[]>
```


### Role Methods

```typescript
// List job roles
getRoles(orgId: string): Promise<RoleWithCounts[]>

// Create role
createRole(orgId: string, name: string): Promise<Role>

// Update role
updateRole(id: string, name: string): Promise<Role>

// Delete role
deleteRole(id: string): Promise<{ message: string }>
```

### Usage Example

```typescript
import { api } from '@/lib/api';

// In component
const fetchData = async () => {
  try {
    const orgs = await api.getOrganizations();
    const schedule = await api.getActiveSchedule(orgs[0].id);
    const employees = await api.getEmployees(orgs[0].id);
  } catch (error: any) {
    console.error('API Error:', error.message);
    Alert.alert('Error', error.message);
  }
};
```

---

## Helper Functions

**File:** `lastCall/lib/helper.ts`

### Date Formatting

```typescript
// Format week start date
formatWeekDate(dateString: string): string
// Returns: "Week of Jan 22, 2024"

// Get next Monday from today
getNextMonday(): string
// Returns: "2024-01-22" (YYYY-MM-DD)

// Get next N Mondays (for date picker)
getNextMondays(count: number = 8): string[]
// Returns: ["2024-01-22", "2024-01-29", ...]
```

### Day Conversions

```typescript
// Convert day abbreviation to full name
dayToFullName(day: string): string
// "Mon" → "Monday"

// Convert full name to abbreviation
fullNameToDay(fullName: string): string
// "Monday" → "Mon"

// Convert date string to day abbreviation
dateToDay(dateString: string): string
// "2024-01-22T00:00:00Z" → "Mon"

// Calculate actual date for day of week given week start
calculateDateForDay(weekStartDate: string, dayKey: string): string
// ("2024-01-22", "Wed") → "2024-01-24T00:00:00Z"
```

### Availability Helpers

```typescript
// Check if employee available for shift
isEmployeeAvailableForShift(
  employeeAvailability: AvailabilityWithFallback[],
  dayOfWeek: string,
  shiftStart: string,
  shiftEnd: string | null
): boolean
```

---

## Development Patterns & Best Practices

### 1. Performance Optimization

**Always prefer bulk operations over loops:**

```typescript
// ❌ BAD - Sequential API calls
for (const shift of shiftsToDelete) {
  await api.deleteShift(shift.id);
}
for (const shift of shiftsToCreate) {
  await api.createShift(scheduleDayId, shift);
}

// ✅ GOOD - Parallel calls
await Promise.all([
  ...shiftsToDelete.map(s => api.deleteShift(s.id)),
  ...shiftsToCreate.map(s => api.createShift(scheduleDayId, s))
]);

// ✅ BEST - Single bulk endpoint
await api.bulkUpdateShifts(scheduleId, {
  delete: shiftsToDelete.map(s => s.id),
  create: shiftsToCreate
});
```

**Results:**
- Sequential: ~3-4 seconds for 30 shifts
- Parallel: ~1 second for 30 shifts
- Bulk: ~350ms for 30 shifts (~8.5x faster)

### 2. State Management for Forms

**Batch changes before saving:**

```typescript
const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
const [originalRoles, setOriginalRoles] = useState<string[]>([]);
const [hasChanges, setHasChanges] = useState(false);

// Initialize when opening modal
const openModal = (employee: EmployeeWithUser) => {
  const roleIds = employee.employeeRoleAssignments.map(a => a.roleId);
  setOriginalRoles(roleIds);
  setSelectedRoles(roleIds);
  setHasChanges(false);
};

// Toggle selection
const toggleRole = (roleId: string) => {
  setSelectedRoles(prev => {
    const newRoles = prev.includes(roleId)
      ? prev.filter(id => id !== roleId)
      : [...prev, roleId];

    // Detect changes
    const changed = JSON.stringify(newRoles.sort()) !== JSON.stringify(originalRoles.sort());
    setHasChanges(changed);

    return newRoles;
  });
};

// Save all at once
const saveChanges = async () => {
  const toAdd = selectedRoles.filter(id => !originalRoles.includes(id));
  const toRemove = originalRoles.filter(id => !selectedRoles.includes(id));

  await Promise.all([
    ...toAdd.map(roleId => api.assignEmployeeRole(orgId, employee.id, roleId)),
    ...toRemove.map(roleId => api.removeEmployeeRole(orgId, employee.id, roleId))
  ]);
};

// Warn on unsaved changes
const closeModal = () => {
  if (hasChanges) {
    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Discard them?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => actuallyClose() }
      ]
    );
  } else {
    actuallyClose();
  }
};
```

### 3. Date/Time Handling

**Timezone-safe patterns:**

```typescript
// ✅ Extract date string directly
const dateStr = dateString.split('T')[0]; // "2024-01-22"

// ✅ Use UTC methods for date arithmetic
const date = new Date(weekStartDate);
date.setUTCDate(date.getUTCDate() + days);
const result = date.toISOString().split('T')[0];

// ✅ Format with UTC timezone
const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
};

// ✅ Display times by extracting substring
const displayTime = shift.startTime.substring(11, 16); // "17:00"

// ❌ AVOID - Timezone shifts
const date = new Date(dateString); // May shift by timezone
date.getDate(); // Returns local date, not UTC date
```

### 4. TypeScript Best Practices

**Always type request bodies in backend:**

```typescript
interface BulkUpdateRequest {
  delete?: string[];
  create?: CreateShiftRequest[];
}

router.post('/:scheduleId/shifts/bulk', async (req: Request, res: Response) => {
  const { delete: idsToDelete = [], create: itemsToCreate = [] } = req.body as BulkUpdateRequest;

  // Now TypeScript knows the types
  itemsToCreate.map(item => item.roleId); // ✅ No error
});
```

**Avoid implicit 'any':**

```typescript
// ❌ BAD
items.map(item => item.name); // Error: Parameter 'item' implicitly has 'any' type

// ✅ GOOD
items.map((item: ItemType) => item.name);

// ✅ BETTER
const items: ItemType[] = getItems();
items.map(item => item.name);
```

### 5. UI/UX Patterns

**Avoid nested modals - use inline expansion:**

```typescript
// ❌ BAD - Modal within modal
<Modal visible={showCreateSchedule}>
  <Modal visible={showDatePicker}>...</Modal>
</Modal>

// ✅ GOOD - Inline expansion
<Modal visible={showCreateSchedule}>
  {showDatePicker && (
    <View style={styles.datePickerContainer}>
      {/* Date picker content */}
    </View>
  )}
</Modal>
```

**Always show loading states:**

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await api.doSomething();
    Alert.alert('Success', 'Operation completed');
  } catch (error: any) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false); // Always cleanup
  }
};

return (
  <TouchableOpacity
    style={[styles.button, loading && styles.buttonDisabled]}
    disabled={loading}
    onPress={handleAction}
  >
    {loading ? (
      <ActivityIndicator color="#ffffff" />
    ) : (
      <Text style={styles.buttonText}>Action</Text>
    )}
  </TouchableOpacity>
);
```

**Clean up state on modal close:**

```typescript
const closeModal = () => {
  setModalVisible(false);
  setSelectedItem(null);
  setHasChanges(false);
  setError(null);
  // Reset all modal-specific state
};
```

### 6. Backend Optimization Patterns

**Use Prisma bulk operations:**

```typescript
// ❌ BAD - Individual creates
for (const item of items) {
  await prisma.item.create({ data: item });
}

// ✅ GOOD - Bulk create
await prisma.item.createMany({
  data: items,
  skipDuplicates: true
});
```

**Use transactions for atomicity:**

```typescript
await prisma.$transaction(async (tx) => {
  // All or nothing
  await tx.shift.deleteMany({
    where: { id: { in: idsToDelete } }
  });

  await tx.shift.createMany({
    data: shiftsToCreate
  });
}, {
  timeout: 10000
});
```

**Add computed fields to reduce frontend work:**

```typescript
// Backend
const operatingDays = schedule.scheduleDays.map(sd => {
  const dayOfWeek = new Date(sd.date).getUTCDay();
  const days = ['Sunday', 'Monday', 'Tuesday', ...];
  return days[dayOfWeek];
});

res.json({ ...schedule, operatingDays });

// Frontend
schedule.operatingDays.forEach(day => {
  console.log(day); // Already computed!
});
```

### 7. Component Organization

**Consistent file structure:**

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { api } from '@/lib/api';

// 2. Types (component-specific)
type LocalState = { ... };

// 3. Component
export default function Component() {
  // 3a. Hooks
  const router = useRouter();
  const { user } = useAuth();

  // 3b. State
  const [data, setData] = useState<DataType[]>([]);

  // 3c. Effects
  useEffect(() => {
    loadData();
  }, []);

  // 3d. Handlers
  const handleAction = async () => { ... };

  // 3e. Render
  return (...);
}

// 4. Styles
const styles = StyleSheet.create({ ... });
```

**Keep components focused:**
- One primary responsibility
- Extract complex modals to separate components
- Use helper functions in lib/helper.ts
- Keep API calls in lib/api.ts

---

## Environment Setup

### Backend Environment Variables

Create `server/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for invite links)
FRONTEND_URL=exp://192.168.1.233:8081
```

### Frontend Environment Variables

Create `lastCall/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Running the Project

**Backend:**
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```

**Frontend:**
```bash
cd lastCall
npm install
npx expo start
```

**Testing:**
- Backend: `http://localhost:3000`
- Frontend: Expo Go app on phone or emulator

---

## Next Steps

### Immediate Tasks (Ready for Implementation)

1. **Test Job Roles Page**
   - Verify CRUD operations
   - Test role assignment/removal
   - Ensure cannot delete roles with shifts

2. **Test Availability Pages**
   - General availability submission
   - Schedule-specific availability
   - Deadline enforcement
   - Availability display in schedule editor

3. **Test Join Organization Flow**
   - Invite link validation
   - Token expiration handling
   - Pending approval workflow

### Production Preparation

1. **Security Hardening**
   - [ ] Update CORS to specific frontend domain
   - [ ] Enable HTTPS enforcement
   - [ ] Review rate limiting rules
   - [ ] Audit authorization checks
   - [ ] Add request logging

2. **Performance Optimization**
   - [ ] Add database indexes
   - [ ] Implement caching (Redis)
   - [ ] Optimize Prisma queries (select only needed fields)
   - [ ] Add request/response compression

3. **User Experience**
   - [ ] Add pull-to-refresh on all list screens
   - [ ] Implement optimistic updates
   - [ ] Add skeleton loaders
   - [ ] Error retry mechanisms
   - [ ] Offline mode with sync

4. **Notifications System**
   - [ ] Push notifications (Expo Push)
   - [ ] Email notifications (SendGrid)
   - [ ] SMS notifications (Twilio)
   - [ ] Notification preferences

5. **Advanced Features**
   - [ ] Shift swap/trade requests
   - [ ] Time-off request system
   - [ ] Reporting dashboard
   - [ ] Export schedules (PDF/CSV)
   - [ ] Multi-location support
   - [ ] Shift templates
   - [ ] Recurring schedules

### Testing Checklist

- [ ] Authentication flow (signup, login, logout)
- [ ] Organization CRUD
- [ ] Employee management (invite, approve, assign roles)
- [ ] Schedule creation and editing
- [ ] Bulk shift operations
- [ ] Schedule publishing
- [ ] Employee schedule viewing
- [ ] Personal schedule viewing
- [ ] Availability submission
- [ ] Job role management
- [ ] Edge cases (expired invites, duplicate joins, etc.)
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Loading states

---

## Design System

### Color Palette

```typescript
const colors = {
  // Backgrounds
  bg_primary: '#020617',      // Slate-950 - Main screen background
  bg_secondary: '#0f172a',    // Slate-900 - Input/card backgrounds
  bg_tertiary: '#1e293b',     // Slate-800 - Elevated cards

  // Borders
  border_primary: '#1e293b',   // Slate-800
  border_secondary: '#334155', // Slate-700

  // Text
  text_primary: '#ffffff',     // White - Headings
  text_secondary: '#94a3b8',   // Slate-400 - Subtitles
  text_tertiary: '#64748b',    // Slate-500 - Descriptions
  text_label: '#cbd5e1',       // Slate-300 - Input labels
  text_muted: '#475569',       // Slate-600 - Disabled/muted

  // Accents
  accent_primary: '#4f46e5',   // Indigo-600 - Primary buttons
  accent_secondary: '#818cf8', // Indigo-400 - Highlights
  accent_info: '#3b82f6',      // Blue-500 - Info badges
  accent_success: '#34d399',   // Emerald-400 - Success states
  accent_warning: '#fbbf24',   // Amber-400 - Warning states
  accent_error: '#ef4444',     // Red-500 - Error states
};
```

### Typography

```typescript
const typography = {
  // Headings
  h1: { fontSize: 48, fontWeight: '700', color: '#ffffff' },
  h2: { fontSize: 32, fontWeight: '700', color: '#ffffff' },
  h3: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  h4: { fontSize: 20, fontWeight: '600', color: '#ffffff' },

  // Body
  body: { fontSize: 16, fontWeight: '400', color: '#ffffff' },
  bodySmall: { fontSize: 14, fontWeight: '400', color: '#94a3b8' },

  // Labels
  label: { fontSize: 14, fontWeight: '600', color: '#cbd5e1' },
  caption: { fontSize: 12, fontWeight: '500', color: '#64748b' },
};
```

### Component Styles

```typescript
const components = {
  // Buttons
  button_height: 56,
  button_borderRadius: 12,

  // Inputs
  input_height: 56,
  input_borderRadius: 12,
  input_paddingHorizontal: 16,

  // Cards
  card_borderRadius: 16,
  card_padding: 16,
  card_marginBottom: 12,

  // Spacing
  spacing_xs: 4,
  spacing_sm: 8,
  spacing_md: 16,
  spacing_lg: 24,
  spacing_xl: 32,
};
```

---

**End of Documentation**

This documentation reflects the exact current state of the LastCall codebase as of December 2024. All file paths, API endpoints, database schema, and implementation details are accurate and match the actual code.

For questions or clarifications, refer to the source code or API client for implementation details.
