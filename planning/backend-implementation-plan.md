# Express.js Backend API with Prisma - Educational Implementation Plan

## Goal
Build a production-ready Express.js REST API backend that:
- Uses Prisma ORM to connect to your existing Supabase PostgreSQL database
- Provides secure, authenticated endpoints for your scheduling app
- Integrates with Supabase Auth for token verification
- Follows industry-standard patterns and best practices
- Guided step-by-step implementation with code explanations

---

## Current Progress

### ✅ Completed Phases:
- ✅ **Phase 1:** Backend Project Setup
- ✅ **Phase 2:** Core Backend Setup (Express + Prisma)
- ✅ **Phase 3:** Authentication Middleware
- ✅ **Phase 4:** API Routes - Organizations
- ✅ **Phase 5:** API Routes - Employees

### 🔄 In Progress:
- **Phase 6:** API Routes - Schedules

### ⏭️ Remaining:
- Phase 7: API Routes - Shifts & Availability
- Phase 8: API Routes - Roles
- Phase 9: Frontend Integration
- Phase 10: Testing & Documentation

---

## Architecture Overview

```
┌─────────────────────────┐
│  React Native App       │  Your mobile app (Expo)
│  Port: 8081 (Expo)      │  - UI with NativeWind
│                         │  - Supabase Auth (client-side)
│  Technologies:          │  - Calls backend API with auth tokens
│  - Expo Router          │
│  - Supabase JS Client   │
│  - NativeWind           │
│  - React Native Reusables │
└───────────┬─────────────┘
            │
            │ HTTP Requests
            │ (with JWT tokens)
            ▼
┌─────────────────────────┐
│  Express.js Backend     │  Node.js server
│  Port: 3000             │  - Verifies auth tokens
│                         │  - Runs Prisma queries
│  Technologies:          │  - Returns JSON responses
│  - Express.js           │
│  - Prisma 6.16.0        │
│  - TypeScript           │
│  - Supabase (verify)    │
└───────────┬─────────────┘
            │
            │ Prisma queries
            ▼
┌─────────────────────────┐
│  Supabase PostgreSQL    │  Your database
│                         │
│  Tables (10):           │
│  - users                │
│  - organizations        │
│  - employees            │
│  - schedules            │
│  - shifts               │
│  - availability         │
│  - roles                │
│  - invite_links         │
│  - schedule_days        │
│  - employee_role_assignments │ (NEW)
└─────────────────────────┘
```

---

## Database Schema Updates

### New Model Added: EmployeeRoleAssignment

**Purpose:** Track which employees can work which job roles (e.g., John can work as Bartender or Server)

```prisma
model EmployeeRoleAssignment {
  id         String   @id @default(uuid()) @db.Uuid
  employeeId String   @map("employee_id") @db.Uuid
  roleId     String   @map("role_id") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at")

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  role     Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([employeeId, roleId])
  @@map("employee_role_assignments")
}
```

**Updated Models:**
- `Employee` model now includes: `roleAssignments EmployeeRoleAssignment[]`
- `Role` model now includes: `employeeAssignments EmployeeRoleAssignment[]`

---

## Implementation Steps

### Phase 1: Backend Project Setup ✅ COMPLETED
**Goal:** Create a new Express.js TypeScript project with proper structure

#### Step 1.1: Initialize Backend Project ✅
- Created `server/` directory in CSCapstone
- Initialized npm project with TypeScript
- Installed dependencies: express, prisma, @supabase/supabase-js, cors, dotenv
- Set up TypeScript configuration
- Created folder structure: src/lib, src/middleware, src/routes, prisma/

**Files created:**
- `server/package.json` - With all dependencies (Prisma 6.16.0, Express 5.2.1)
- `server/tsconfig.json` - TypeScript config without rootDir restriction
- `server/.env` - Environment variables (DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, PORT)
- `server/src/` directory structure

**Key Learnings:**
- Prisma 7 has breaking changes; downgraded to Prisma 6.16.0 for stability
- Windows PowerShell has npm PATH issues; use Git Bash for development
- Must use DIRECT database connection URL (port 5432), not pooled connection

#### Step 1.2: Move Prisma to Backend ✅
- Copied `prisma/schema.prisma` from lastCall to server
- Updated generator to use `prisma-client-js` (Prisma 6 format)
- Copied environment variables to server/.env
- Generated Prisma Client successfully
- Tested database connection

**Files created/modified:**
- `server/prisma/schema.prisma` - Updated generator settings
- `server/.env` - Added database credentials
- `server/prisma.config.js` - Prisma 6 config with datasource URL

---

### Phase 2: Core Backend Setup ✅ COMPLETED
**Goal:** Set up Express server with Prisma client

#### Step 2.1: Create Prisma Client Singleton ✅
Created `server/src/lib/prisma.ts` with:
- PostgreSQL connection pooling using `pg`
- Prisma adapter setup with `@prisma/adapter-pg`
- Singleton pattern for development hot-reload
- dotenv loading BEFORE creating pool (critical!)

**Key Issue Resolved:**
- Initially getting "Can't reach database server at 127.0.0.1:5432"
- **Fix:** Added `dotenv.config()` at top of prisma.ts to load DATABASE_URL before creating pool

**File created:**
```typescript
// server/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config() // CRITICAL: Load env vars first!

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    adapter,
    log: ['error', 'warn']
})

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}
```

#### Step 2.2: Create Express Server ✅
Created `server/src/index.ts` with:
- CORS middleware (allow all origins for development)
- JSON body parser
- Health check endpoint (`/health`)
- Database test endpoint (`/api/test-db`)
- 404 handler
- Graceful shutdown handlers

**Key Issue Resolved:**
- Forgot `await` on `prisma.user.count()` - returned query spec instead of count
- **Fix:** Added `await` keyword

**File created:**
```typescript
// server/src/index.ts
import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { prisma } from './lib/prisma'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count() // Added await!
    res.json({
      status: 'success',
      message: 'Database connected',
      userCount
    })
  } catch (error) {
    console.error('Database connection error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed'
    })
  }
})

// ... 404 handler, error handler, server start, graceful shutdown
```

#### Step 2.3: Add NPM Scripts ✅
Updated `package.json` with development scripts:
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push"
  }
}
```

**Note:** Must use Git Bash on Windows, not PowerShell (PATH issues with ts-node-dev)

---

### Phase 3: Authentication Middleware ✅ COMPLETED
**Goal:** Verify Supabase JWT tokens in backend requests

#### Step 3.1: Extend Express Request Type ✅
Created `server/src/types/express.d.ts`:
```typescript
import { Request } from "express"

declare global {
    namespace Express {
        interface Request {
            userId?: string
        }
    }
}
```

#### Step 3.2: Create Auth Middleware ✅
Created `server/src/middleware/auth.ts`:
- Extracts JWT from Authorization header
- Verifies token with Supabase using `supabase.auth.getUser(token)`
- Attaches `userId` to request object
- Returns 401 for invalid/expired tokens

**File created:**
```typescript
import { Request, Response, NextFunction } from "express"
import { createClient } from "@supabase/supabase-js"
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
)

export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header provided' })
        }

        const token = authHeader.replace('Bearer ', '')

        if (!token) {
            return res.status(401).json({ error: 'No token provided' })
        }

        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' })
        }

        req.userId = user.id
        next()

    } catch (error) {
        console.error('Auth middleware error:', error)
        return res.status(401).json({ error: 'Authentication failed' })
    }
}
```

#### Step 3.3: Create Error Handler Middleware ✅
Created `server/src/middleware/errorHandler.ts`:
- Centralized error handling (must be LAST middleware)
- Logs error details for debugging
- Returns 500 with error message in development only

**File created:**
```typescript
import { Request, Response, NextFunction } from "express"

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error('Error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    })

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
}
```

#### Integration ✅
Updated `server/src/index.ts`:
- Imported both middleware
- Added protected test route: `GET /api/protected`
- Added error handler as LAST middleware

---

### Phase 4: API Routes - Organizations ✅ COMPLETED
**Goal:** Build CRUD endpoints for organizations

#### Step 4.1: Organization Routes ✅
Created `server/src/routes/organizations.ts` with all endpoints:

**Endpoints:**
- `GET /api/organizations` - List user's organizations (owned OR employee of)
- `GET /api/organizations/:id` - Get single organization with details
- `POST /api/organizations` - Create organization (user becomes owner + creates employee record)
- `PATCH /api/organizations/:id` - Update organization (owner only)
- `DELETE /api/organizations/:id` - Delete organization (owner only, cascades)

**Key Business Logic:**
- User sees orgs they own OR where they're an APPROVED employee
- Pending employees don't see org until approved
- Creating org automatically creates Employee record with role=OWNER, status=APPROVED
- Only owner can update/delete organization
- Deleting org cascades to all related data (employees, schedules, shifts, etc.)

**File created:**
```typescript
// server/src/routes/organizations.ts
import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// All routes protected with authMiddleware
// GET, GET/:id, POST, PATCH/:id, DELETE/:id

export default router
```

#### Integration ✅
Updated `server/src/index.ts`:
```typescript
import organizationsRouter from './routes/organizations'

app.use('/api/organizations', organizationsRouter)
```

---

### Phase 5: API Routes - Employees ✅ COMPLETED
**Goal:** Manage organization employees and invitations

#### Step 5.1: Employee Routes ✅
Created `server/src/routes/employee.ts` (singular) with:

**Helper Function:**
```typescript
async function isOrgAdmin(userId: string, orgId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      employees: {
        where: { userId: userId, status: 'APPROVED' }
      }
    }
  })

  if (!org) return false

  return (
    org.ownerId === userId ||
    org.employees.some(emp => emp.role === 'ADMIN' || emp.role === 'OWNER')
  )
}
```

**Endpoints:**

1. **GET** `/api/organizations/:orgId/employees` - List all employees
   - Admins see all employees (including pending)
   - Regular employees can view list if they're approved
   - Ordered by status (approved first), then createdAt

2. **POST** `/api/organizations/:orgId/employees/invite` - Create invite link
   - Only admins/owners can create
   - Generates cryptographically secure 64-char token
   - Expires in 7 days (configurable)
   - Returns full invite URL

3. **POST** `/api/invite/:token` - Join organization via invite
   - Public route (requires auth but not org membership)
   - Validates token is not expired
   - Creates employee with status=PENDING (requires approval)
   - Can't join if already a member

4. **PATCH** `/api/organizations/:orgId/employees/:employeeId` - Update employee
   - Only admins/owners can update
   - Can approve/deny pending employees
   - Can change roles (EMPLOYEE → ADMIN)
   - Cannot modify the OWNER
   - Sets `approvedAt` when status changes to APPROVED

5. **DELETE** `/api/organizations/:orgId/employees/:employeeId` - Remove employee
   - Only admins/owners can remove
   - Cannot remove the OWNER
   - Permanently deletes employee record

#### Step 5.2: Employee Role Assignments (Job Positions) ✅
**NEW FEATURE:** Track which employees can work which job roles

Added endpoints to manage job role qualifications:

6. **POST** `/api/organizations/:orgId/employees/:employeeId/roles` - Assign job role
   - Assigns a job role to an employee (e.g., make John a "Bartender")
   - Only admins/owners can assign
   - Prevents duplicate assignments
   - Creates `EmployeeRoleAssignment` record

7. **DELETE** `/api/organizations/:orgId/employees/:employeeId/roles/:roleId` - Remove job role
   - Removes a job role assignment from an employee
   - Only admins/owners can remove

**Example Usage:**
```typescript
// POST /api/organizations/abc123/employees/john-id/roles
// Body: { "roleId": "bartender-role-id" }
// Result: John can now work Bartender shifts

// When creating shifts, filter for qualified employees:
const qualifiedEmployees = await prisma.employee.findMany({
  where: {
    organizationId: orgId,
    roleAssignments: {
      some: { roleId: bartenderRoleId }
    }
  }
})
```

#### Integration ✅
Updated `server/src/index.ts`:
```typescript
import employeesRouter from './routes/employee'

app.use('/api/organizations', employeesRouter) // For /:orgId/employees/* routes
app.use('/api', employeesRouter) // For /invite/:token route
```

**Key Learnings:**
- EmployeeRole (OWNER, ADMIN, EMPLOYEE) = permissions/access control
- Role model (Bartender, Bouncer, etc.) = job positions
- EmployeeRoleAssignment = which employees can work which jobs
- Need two `app.use()` calls for different route prefixes

---

### Phase 6: API Routes - Schedules (IN PROGRESS)
**Goal:** Create and manage weekly schedules

#### Step 6.1: Schedule Routes
Endpoints to build:
- `GET /api/organizations/:orgId/schedules` - List schedules
- `GET /api/schedules/:id` - Get schedule with all shifts
- `POST /api/organizations/:orgId/schedules` - Create new schedule
- `PATCH /api/schedules/:id` - Update schedule
- `POST /api/schedules/:id/publish` - Publish schedule (notify employees)
- `DELETE /api/schedules/:id` - Delete schedule

**Key concepts:**
- Complex Prisma queries with nested relations
- Date handling (week start dates)
- Schedule publishing workflow
- Unique constraints (one schedule per week per org)

**Business logic:**
- Only OWNER/ADMIN can create/edit schedules
- All employees can view published schedules
- PENDING employees can't see schedules
- Publishing checks if all shifts are assigned

---

### Phase 7: API Routes - Shifts & Availability
**Goal:** Manage individual shifts and employee availability

#### Step 7.1: Shift Routes
- `GET /api/schedules/:scheduleId/shifts` - List all shifts
- `POST /api/schedules/:scheduleId/shifts` - Create shift
- `PATCH /api/shifts/:id` - Update shift (assign employee)
- `DELETE /api/shifts/:id` - Delete shift

#### Step 7.2: Availability Routes
- `GET /api/schedules/:scheduleId/availability` - View all availability
- `POST /api/schedules/:scheduleId/availability` - Submit availability
- `PATCH /api/availability/:id` - Update availability
- `DELETE /api/availability/:id` - Remove availability

**Key concepts:**
- Time handling (start/end times)
- Availability status (AVAILABLE, UNAVAILABLE, PREFERRED)
- Availability deadline enforcement
- Shift conflicts detection

**Business logic:**
- Only OWNER/ADMIN can assign shifts
- Employees can submit their own availability
- Can't change availability after deadline
- Warn when assigning unavailable employee

---

### Phase 8: API Routes - Roles
**Goal:** Manage job roles within organizations

#### Step 8.1: Role Routes
- `GET /api/organizations/:orgId/roles` - List roles
- `POST /api/organizations/:orgId/roles` - Create role
- `PATCH /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

**Key concepts:**
- Unique constraint (role name per organization)
- Check if role is in use before deleting
- Role is required for shifts

**Business logic:**
- Only OWNER/ADMIN can manage roles
- Can't delete role that has shifts assigned
- Roles are organization-specific

---

### Phase 9: Frontend Integration
**Goal:** Update React Native app to use backend API instead of direct Prisma

#### Step 9.1: Create API Client
- Create API service layer
- Handle authentication headers
- Error handling and retries
- TypeScript types for API responses

**File to create:**
- `lastCall/lib/api.ts`

**Key concepts:**
- Fetch API with auth headers
- Token refresh handling
- Request/response interceptors
- Type-safe API calls

#### Step 9.2: Update AuthContext
- Remove Prisma import (causes "window is not defined" error)
- Use API client for loadDbUser
- Use API client for signUp user creation
- Keep Supabase client for auth only

**File to modify:**
- `lastCall/contexts/AuthContext.tsx`

**Key changes:**
- Replace `prisma.user.findUnique()` with API call
- Replace `prisma.user.create()` with API call
- Keep Supabase auth methods (signIn, signUp, signOut)

---

### Phase 10: Testing & Documentation
**Goal:** Ensure API works correctly and document usage

#### Step 10.1: Manual Testing
- Test each endpoint with cURL or Postman
- Verify authentication works
- Test error cases
- Check database changes

#### Step 10.2: Create API Documentation
- Document all endpoints
- Include request/response examples
- Note authentication requirements
- Document error codes

**File to create:**
- `server/API.md`

---

## Key Files & Their Purpose

### Backend Files (Completed):
1. ✅ **server/src/index.ts** - Express server entry point
2. ✅ **server/src/lib/prisma.ts** - Prisma client singleton
3. ✅ **server/src/types/express.d.ts** - TypeScript type extensions
4. ✅ **server/src/middleware/auth.ts** - JWT verification middleware
5. ✅ **server/src/middleware/errorHandler.ts** - Centralized error handling
6. ✅ **server/src/routes/organizations.ts** - Organization CRUD
7. ✅ **server/src/routes/employee.ts** - Employee management + role assignments

### Backend Files (Pending):
8. ⏭️ **server/src/routes/schedules.ts** - Schedule management
9. ⏭️ **server/src/routes/shifts.ts** - Shift management
10. ⏭️ **server/src/routes/availability.ts** - Availability management
11. ⏭️ **server/src/routes/roles.ts** - Role management

### Frontend Files to Update:
1. ⏭️ **lastCall/lib/api.ts** - New API client
2. ⏭️ **lastCall/contexts/AuthContext.tsx** - Remove Prisma, use API

---

## Technologies & Packages

### Backend Dependencies (Installed):
```json
{
  "dependencies": {
    "express": "^5.2.1",
    "@prisma/client": "^6.16.0",
    "@prisma/adapter-pg": "^6.16.0",
    "pg": "^8.16.3",
    "@supabase/supabase-js": "^2.88.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "crypto": "built-in"
  },
  "devDependencies": {
    "typescript": "^5.9.2",
    "@types/express": "^5.0.6",
    "@types/node": "^25.0.2",
    "@types/cors": "^2.8.19",
    "@types/pg": "^8.16.0",
    "ts-node-dev": "^2.0.0",
    "prisma": "^6.16.0"
  }
}
```

**Key Version Notes:**
- Using Prisma 6.16.0 (NOT Prisma 7) due to stability issues
- Express 5.2.1 (latest stable)

### Frontend Dependencies (Existing):
- React Native 0.81.5 with Expo SDK 54
- NativeWind 4.2.1 (Tailwind CSS for React Native)
- Supabase JS Client 2.86.2
- React Native Reusables (UI components)

---

## Security Considerations

1. **Authentication:** All API routes (except health check) require valid JWT ✅
2. **Authorization:** Check user permissions before allowing actions ✅
3. **Input Validation:** Validate all user input (email format, UUIDs, etc.) ✅
4. **SQL Injection:** Protected by Prisma (parameterized queries) ✅
5. **CORS:** Allow all origins in development; restrict in production ⏭️
6. **Environment Variables:** Never commit .env files ✅
7. **Error Messages:** Don't leak sensitive info in production ✅
8. **Rate Limiting:** Consider adding rate limiting for production ⏭️
9. **RLS (Row Level Security):** Configure Supabase RLS policies before production ⏭️

---

## Development Workflow

### Running Both Servers:
```bash
# Terminal 1: Backend API (Git Bash on Windows)
cd server
npm run dev
# Runs on http://localhost:3000

# Terminal 2: React Native App
cd lastCall
npm start
# Runs on exp://localhost:8081
```

### Making API Calls from React Native:
```typescript
// In React Native app
const API_URL = 'http://localhost:3000/api'

// Get auth token from Supabase
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

// Call backend API
const response = await fetch(`${API_URL}/organizations`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
const organizations = await response.json()
```

---

## Issues Encountered & Resolutions

### Issue 1: Prisma 7 Breaking Changes
**Problem:** Prisma 7.1.0 had multiple issues:
- Required custom output path
- Module resolution errors
- Generator provider confusion
- "prepared statement already exists" error

**Resolution:** Downgraded to Prisma 6.16.0 (stable, battle-tested)

---

### Issue 2: Missing `await` on Prisma Queries
**Problem:** `prisma.user.count()` without `await` returned query spec object instead of count
**Resolution:** Added `await` keyword - critical for all async Prisma operations

---

### Issue 3: Database Connection Error
**Problem:** "Can't reach database server at 127.0.0.1:5432"
**Resolution:** Added `dotenv.config()` at TOP of `prisma.ts` before creating pool

---

### Issue 4: Windows PowerShell npm PATH Issues
**Problem:** `ts-node-dev` not recognized in PowerShell
**Resolution:** Use Git Bash for development instead of PowerShell

---

### Issue 5: Connection Pooling vs Direct Connection
**Problem:** "prepared statement 's1' already exists" when using Supabase pooled URL
**Resolution:** Use DIRECT connection URL (port 5432), not pooled URL with pgbouncer

---

### Issue 6: Missing Employee Role Assignments
**Problem:** No way to track which employees can work which job roles (Bartender, Server, etc.)
**Resolution:**
- Added `EmployeeRoleAssignment` model to schema
- Created POST/DELETE endpoints for role assignments
- Now employees can be assigned multiple job roles

---

## Timeline Estimate

**Completed:** ~8 hours
- Phase 1-2 (Setup): 2 hours (includes troubleshooting)
- Phase 3 (Auth): 1 hour
- Phase 4-5 (Organizations + Employees): 5 hours

**Remaining:** ~6-8 hours
- Phase 6-8 (Schedules, Shifts, Roles): 4-5 hours
- Phase 9 (Frontend): 2 hours
- Phase 10 (Testing): 1 hour

**Total:** ~14-16 hours of focused work

Perfect for your January 7th deadline!

---

## What You've Learned

✅ Express.js fundamentals
✅ RESTful API design patterns
✅ JWT authentication with Supabase
✅ Authorization (role-based permissions)
✅ Prisma ORM usage and best practices
✅ TypeScript in backend development
✅ Database schema design (normalization, relationships)
✅ Error handling and middleware patterns
✅ Production-ready architecture

---

## Next Steps

**Current:** Complete Phase 6 (Schedules API)

**Then:** Phase 7 → 8 → 9 → 10 → Production deployment by January 7th! 🚀
