/**
 * API Type Definitions
 * These match your backend Prisma schema and API responses
 */

// ============================================================================
// Enums
// ============================================================================

export type EmployeeRole = 'OWNER' | 'ADMIN' | 'EMPLOYEE';
export type EmployeeStatus = 'PENDING' | 'APPROVED' | 'DENIED';
export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED';

// ============================================================================
// Base Models (what's stored in database)
// ============================================================================

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

export interface InviteLink {
  id: string;
  organizationId: string;
  token: string;
  expiresAt: string;
  createdById: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  organizationId: string;
  name: string | null;
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
  isOnCall: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  id: string;
  employeeId: string;
  dayOfWeek: string;
  status: AvailabilityStatus;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralAvailability {
  id: string;
  userId: string;
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

// ============================================================================
// API Response Types (includes relations)
// ============================================================================

/**
 * User with minimal info (used in nested responses)
 */
export interface UserBasic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Organization with counts
 */
export interface OrganizationWithCounts extends Organization {
  owner: UserBasic;
  _count: {
    employees: number;
    schedules: number;
  };
}

/**
 * Organization with full details
 */
export interface OrganizationDetail extends Organization {
  owner: UserBasic;
  employees: EmployeeWithUser[];
  roles: Role[];
  schedules: Schedule[];
}

/**
 * Employee with user info
 */
export interface EmployeeWithUser extends Employee {
  user: UserBasic;
}

/**
 * Employee with role assignments
 */
export interface EmployeeWithRoles extends EmployeeWithUser {
  roleAssignments: EmployeeRoleAssignment[];
}

/**
 * Invite link with organization info
 */
export interface InviteLinkWithOrg extends InviteLink {
  organization: {
    id: string;
    name: string;
  };
  inviteUrl: string;
}

/**
 * Schedule with basic info and counts
 */
export interface ScheduleWithCounts extends Schedule {
  _count: {
    scheduleDays: number;
  };
}
/**
 * The Day schedule
 */
export interface DaySchedule {
  dayOfWeek: string;
  status: AvailabilityStatus;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
};

/**
 * Shift with full details
 */
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

/**
 * Schedule with full details (days, shifts)
 */
export interface ScheduleDetail extends Schedule {
  organization: {
    id: string;
    name: string;
    ownerId: string;
  };
  scheduleDays: ScheduleDayWithShifts[];
  operatingDays: string[]; // Computed: day names like ['Monday', 'Friday']
}

/**
 * ScheduleDay with shifts
 */
export interface ScheduleDayWithShifts extends ScheduleDay {
  shifts: ShiftDetail[];
}

/**
 * Availability with employee info
 */
export interface AvailabilityWithEmployee extends Availability {
  employee: EmployeeWithUser;
}

/**
 * Availability with fallback flag (returned when general availability is used)
 */
export interface AvailabilityWithFallback extends Availability {
  isGeneral?: boolean; // true if this came from general availability
}

/**
 * Availability with employee info and fallback flag
 */
export interface AvailabilityWithEmployeeAndFallback extends AvailabilityWithEmployee {
  isGeneral?: boolean;
}

/**
 * Role with counts
 */
export interface RoleWithCounts extends Role {
  _count: {
    shifts: number;
    employeeAssignments: number;
  };
}

/**
 * Employee role assignment with role details
 */
export interface EmployeeRoleAssignmentWithRole extends EmployeeRoleAssignment {
  role: Role;
}

// ============================================================================
// API Request Types (what you send to the backend)
// ============================================================================

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
}

export interface CreateInviteLinkRequest {
  expiresInDays?: number;
}

export interface UpdateEmployeeRequest {
  status?: EmployeeStatus;
  role?: EmployeeRole;
}

export interface CreateScheduleRequest {
  name?: string;
  weekStartDate: string;
  availabilityDeadline: string;
  operatingDays?: string[];
}

export interface UpdateScheduleDaysRequest {
  addDays?: string[];
  removeDays?: string[];
}

export interface CreateShiftRequest {
  roleId: string;
  startTime: string;
  endTime?: string;
  employeeId?: string;
  isOnCall?: boolean;
}

export interface UpdateShiftRequest {
  startTime?: string;
  endTime?: string;
  roleId?: string;
  employeeId?: string | null;
  isOnCall?: boolean;
}

export interface UpdateOrgAvailabilityRequest {
  availability: Array<{
    dayOfWeek: string;
    status: AvailabilityStatus;
    startTime?: string;
    endTime?: string;
  }>;
}

export interface UpdateAvailabilityRequest {
  status?: AvailabilityStatus;
  startTime?: string | null;
  endTime?: string | null;
}

export interface UpdateGeneralAvailabilityRequest {
  availability: Array<{
    dayOfWeek: string;
    status: AvailabilityStatus;
    startTime?: string;
    endTime?: string;
  }>;
}

export interface CreateRoleRequest {
  name: string;
}

export interface UpdateRoleRequest {
  name: string;
}

export interface AssignEmployeeRoleRequest {
  roleId: string;
}

export interface CreateUserRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// ============================================================================
// API Error Response
// ============================================================================

export interface ApiError {
  error: string;
  message?: string;
  hint?: string;
}
