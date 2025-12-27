import { supabase } from './supabase';
import type {
    UserBasic,
    OrganizationWithCounts,
    OrganizationDetail,
    EmployeeWithUser,
    InviteLinkWithOrg,
    ScheduleWithCounts,
    ScheduleDetail,
    ScheduleType,
    ShiftDetail,
    AvailabilityWithEmployee,
    Availability,
    GeneralAvailability,
    AvailabilityWithFallback,
    RoleWithCounts,
    EmployeeRoleAssignmentWithRole,
    CreateOrganizationRequest,
    UpdateOrganizationRequest,
    UpdateEmployeeRequest,
    CreateScheduleRequest,
    CreateShiftRequest,
    UpdateShiftRequest,
    UpdateOrgAvailabilityRequest,
    UpdateGeneralAvailabilityRequest,
    CreateUserRequest,
    AssignEmployeeRoleRequest,
    SaveAsTemplateRequest,
    CreateDraftFromTemplateRequest,
    Role,
    User,
    UpdateUserProfileRequest,
    UpdatePrivacySettingsRequest,
    UpdateNotificationPreferencesRequest,
} from '@/types/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;


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
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
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
     * PUT Request
     */
    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
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

    async getSchedules(orgId: string, type?: ScheduleType) {
        const params = type ? `?type=${type}` : '';
        return this.get<ScheduleWithCounts[]>(`/organizations/${orgId}/schedules${params}`);
    }

    async getSchedule(id: string) {
        return this.get<ScheduleDetail>(`/schedules/${id}`);
    }

    async getActiveSchedule(orgId: string) {
        return this.get<ScheduleDetail>(`/organizations/${orgId}/active-schedule`);
    }

    async getShiftConflicts(orgId: string, startDate: string, endDate: string) {
        return this.get<Record<string, string[]>>(`/organizations/${orgId}/shift-conflicts?startDate=${startDate}&endDate=${endDate}`);
    }

    async createSchedule(orgId: string, data: CreateScheduleRequest) {
        return this.post<ScheduleDetail>(`/organizations/${orgId}/schedules`, data);
    }

    async publishSchedule(id: string) {
        return this.post<{ message: string; schedule: ScheduleDetail }>(`/schedules/${id}/publish`);
    }

    async saveAsTemplate(id: string, data: SaveAsTemplateRequest) {
        return this.post<{ message: string; template: ScheduleDetail }>(`/schedules/${id}/save-as-template`, data);
    }

    async createDraftFromTemplate(templateId: string, data: CreateDraftFromTemplateRequest) {
        return this.post<{ message: string; schedule: ScheduleDetail }>(`/templates/${templateId}/create-draft`, data);
    }

    async updateScheduleDays(id: string, data: { addDays?: string[]; removeDays?: string[] }) {
        return this.patch<ScheduleDetail>(`/schedules/${id}/days`, data);
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

    async bulkUpdateShifts(
        scheduleId: string,
        data: {
            delete: string[],
            create: Array<{
                scheduleDayId: string;
                roleId: string;
                startTime: string;
                endTime?: string;
                employeeId?: string;
                isOnCall?: boolean;
            }>
        }
    ) {
        return this.post<{ message: string; deleted: number; created: number }>(
            `/schedules/${scheduleId}/shifts/bulk`,
            data
        );
    }

    /**
     * Organization Availability Endpoints
     */

    async getAllOrgAvailability(orgId: string) {
        return this.get<AvailabilityWithEmployee[]>(`/organizations/${orgId}/availability`);
    }

    async getMyOrgAvailability(orgId: string) {
        return this.get<AvailabilityWithFallback[]>(`/organizations/${orgId}/availability/me`);
    }

    async updateMyOrgAvailability(orgId: string, data: UpdateOrgAvailabilityRequest) {
        return this.put<{ message: string; availability: Availability[] }>(`/organizations/${orgId}/availability`, data);
    }

    async getEmployeeOrgAvailability(orgId: string, employeeId: string) {
        return this.get<{ employee: EmployeeWithUser; availability: AvailabilityWithFallback[] }>(`/organizations/${orgId}/availability/${employeeId}`);
    }

    /**
     * General Availability Endpoints
     */

    async getMyGeneralAvailability() {
        return this.get<GeneralAvailability[]>('/users/me/general-availability');
    }

    async updateMyGeneralAvailability(data: UpdateGeneralAvailabilityRequest) {
        return this.put<{ message: string; availability: GeneralAvailability[] }>('/users/me/general-availability', data);
    }

    async getUserGeneralAvailability(userId: string) {
        return this.get<GeneralAvailability[]>(`/users/${userId}/general-availability`);
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

    /**
     * User Profile and Settings Endpoints
     */
    /**
     * Gets user profile
     * @returns User Profile
     */
    async getUserProfile() {
        return this.get<User>('/users/me');
    }
    /**
     * Update User Profile
     * @param data The data to update the users profile
     * @returns User after update
     */
    async updateUserProfile(data: UpdateUserProfileRequest) {
        return this.patch<User>('/users/me', data);
    }
    /**
     * Updates the privacy settings
     * @param data Updated privacy settings
     * @returns the updated privacy settings and the user id
     */
    async updatePrivacySettings(data: UpdatePrivacySettingsRequest) {
        return this.patch<{ id: string; shareEmail: boolean; sharePhone: boolean }>('/users/me/privacy', data);
    }
    /**
     * Update the notifications settings
     * @param data the updated notification data
     * @returns the updated notification data
     */
    async updateNotificationPreferences(data: UpdateNotificationPreferencesRequest) {
        return this.patch<{ id: string; pushEnabled: boolean; emailEnabled: boolean }>(
            '/users/me/notifications',
            data
        );
    }
    /**
     * Deletes the user
     * @returns a message that the user was deleted successfully
     */
    async deleteUser() {
        return this.delete<{ message: string }>('/users/me');
    }

    /**
     * Update user's push notification token
     * @param pushToken The Expo push token
     * @returns Updated user data
     */
    async updatePushToken(pushToken: string) {
        return this.patch<{ id: string; pushToken: string }>('/users/me/push-token', { pushToken });
    }

}

export const api = new ApiClient(API_URL);