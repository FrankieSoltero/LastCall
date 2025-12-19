import { supabase } from './supabase';
import type {
    UserBasic,
    OrganizationWithCounts,
    OrganizationDetail,
    EmployeeWithUser,
    InviteLinkWithOrg,
    ScheduleWithCounts,
    ScheduleDetail,
    ShiftDetail,
    AvailabilityWithEmployee,
    Availability,
    RoleWithCounts,
    EmployeeRoleAssignmentWithRole,
    CreateOrganizationRequest,
    UpdateOrganizationRequest,
    UpdateEmployeeRequest,
    CreateScheduleRequest,
    CreateShiftRequest,
    UpdateShiftRequest,
    SubmitAvailabilityRequest,
    CreateUserRequest,
    AssignEmployeeRoleRequest,
    Role,
} from '@/types/api';

const API_URL = 'http://192.168.1.233:3000/api';


/**
 * API Client class 
 * This handles all backend requests
 */

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async getAuthToken(): Promise<string | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = await this.getAuthToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        }
        if (options.headers) {
            const existingHeaders = options.headers as Record<string, string>
            Object.assign(headers, existingHeaders);
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error'}));
            throw new Error(error.error || `HTTP ${response.status}`); 
        }

        return response.json();
    }

    /**
     * GET Request
     */
    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }
    /**
     * POST request
     */
    async post<T>(endpoint: string, data?: any): Promise<T> {
        console.log(endpoint);
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        });
    }
    /**
     * PATCH request
     */
    async patch<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined
        });
    }
    /**
     * DELETE request
     */
    async delete<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    /**
     * Get current user from the database
     */
    async getCurrentUser() {
        return this.get<UserBasic>('/protected');
    }

    // =============================================================================
    // Organization Endpoints
    // =============================================================================

    async getOrganizations() {
        return this.get<OrganizationWithCounts[]>('/organizations');
    }

    async getOrganization(id: string) {
        return this.get<OrganizationDetail>(`/organizations/${id}`);
    }

    async createOrganization(data: CreateOrganizationRequest) {
        return this.post<OrganizationDetail>('/organizations', data);
    }

    async updateOrganization(id: string, data: UpdateOrganizationRequest) {
        return this.patch<OrganizationDetail>(`/organizations/${id}`, data);
    }

    async deleteOrganization(id: string) {
        return this.delete<{ message: string }>(`/organizations/${id}`);
    }

    // =============================================================================
    // Employee Endpoints
    // =============================================================================

    async getEmployees(orgId: string) {
        return this.get<EmployeeWithUser[]>(`/organizations/${orgId}/employees`);
    }

    async getEmployee(orgId: string) {
        return this.get<EmployeeWithUser>(`/organizations/${orgId}/employee`);
    }

    async createInviteLink(orgId: string, expiresInDays: number = 7) {
        return this.post<InviteLinkWithOrg>(`/organizations/${orgId}/employees/invite`, { expiresInDays });
    }

    async joinOrganization(token: string) {
        return this.post<{ message: string; employee: EmployeeWithUser }>(`/invite/${token}`);
    }

    /**
     * Assign a job role to an employee (e.g., make John a Bartender)
     */
    async assignEmployeeRole(orgId: string, employeeId: string, roleId: string) {
        return this.post<EmployeeRoleAssignmentWithRole>(
            `/organizations/${orgId}/employees/${employeeId}/roles`,
            { roleId }
        );
    }

    /**
     * Remove a job role assignment from an employee
     */
    async removeEmployeeRole(orgId: string, employeeId: string, roleId: string) {
        return this.delete<{ message: string }>(
            `/organizations/${orgId}/employees/${employeeId}/roles/${roleId}`
        );
    }

    /**
     * Update employee (approve/deny, change role, etc.)
     */
    async updateEmployee(orgId: string, employeeId: string, data: UpdateEmployeeRequest) {
        return this.patch<EmployeeWithUser>(`/organizations/${orgId}/employees/${employeeId}`, data);
    }

    /**
     * Remove employee from organization
     */
    async removeEmployee(orgId: string, employeeId: string) {
        return this.delete<{ message: string }>(`/organizations/${orgId}/employees/${employeeId}`);
    }

    // =============================================================================
    // Schedule Endpoints
    // =============================================================================

    async getSchedules(orgId: string) {
        return this.get<ScheduleWithCounts[]>(`/organizations/${orgId}/schedules`);
    }

    async getSchedule(id: string) {
        return this.get<ScheduleDetail>(`/schedules/${id}`);
    }

    async createSchedule(orgId: string, data: CreateScheduleRequest) {
        return this.post<ScheduleDetail>(`/organizations/${orgId}/schedules`, data);
    }

    async publishSchedule(id: string) {
        return this.post<{ message: string; schedule: ScheduleDetail }>(`/schedules/${id}/publish`);
    }

    /**
     * Shift endpoints
     */

    async getShifts(scheduleId: string) {
        return this.get<ShiftDetail[]>(`/schedules/${scheduleId}/shifts`);
    }

    async createShift(scheduleDayId: string, data: CreateShiftRequest) {
        return this.post<ShiftDetail>(`/schedule-days/${scheduleDayId}/shifts`, data);
    }

    async updateShift(id: string, data: UpdateShiftRequest) {
        return this.patch<ShiftDetail>(`/shifts/${id}`, data);
    }

    async deleteShift(id: string) {
        return this.delete<{ message: string }>(`/shifts/${id}`);
    }

    /**
     * Availability Endpoints
     */

    async getAllAvailability(scheduleId: string) {
        return this.get<AvailabilityWithEmployee[]>(`/schedules/${scheduleId}/availability`);
    }

    async getMyAvailability(scheduleId: string) {
        return this.get<Availability[]>(`/schedules/${scheduleId}/availability/me`);
    }

    async submitAvailability(scheduleId: string, data: SubmitAvailabilityRequest) {
        return this.post<Availability[]>(`/schedules/${scheduleId}/availability`, data);
    }

    /**
     * Role Endpoints
     */

    async getRoles(orgId: string) {
        return this.get<RoleWithCounts[]>(`/organizations/${orgId}/roles`);
    }

    /**
     * Create role
     */
    async createRole(orgId: string, name: string) {
        return this.post<Role>(`/organizations/${orgId}/roles`, { name });
    }

    /**
     * Update role
     */
    async updateRole(id: string, name: string) {
        return this.patch<Role>(`/roles/${id}`, { name });
    }

    /**
     * Delete role
     */
    async deleteRole(id: string) {
        return this.delete<{ message: string }>(`/roles/${id}`);
    }

}

export const api = new ApiClient(API_URL);