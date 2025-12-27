import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

/**
 * React Query hooks for API calls
 * These hooks provide automatic caching, deduplication, and invalidation
 */

// Query Keys - centralized for consistency
export const queryKeys = {
  organizations: ['organizations'] as const,
  organization: (id: string) => ['organization', id] as const,
  employees: (orgId: string) => ['employees', orgId] as const,
  employee: (orgId: string) => ['employee', orgId] as const,
  userProfile: ['userProfile'] as const,
  roles: (orgId: string) => ['roles', orgId] as const,
  schedules: (orgId: string, type?: string) => type ? ['schedules', orgId, type] as const : ['schedules', orgId] as const,
  schedule: (id: string) => ['schedule', id] as const,
  activeSchedule: (orgId: string) => ['activeSchedule', orgId] as const,
  availability: (orgId: string) => ['availability', orgId] as const,
  myOrgAvailability: (orgId: string) => ['myOrgAvailability', orgId] as const,
  myGeneralAvailability: ['myGeneralAvailability'] as const,
  shiftConflicts: (orgId: string, startDate: string, endDate: string) =>
    ['shiftConflicts', orgId, startDate, endDate] as const,
};

// --- QUERIES ---

export function useOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations,
    queryFn: () => api.getOrganizations(),
  });
}

export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: queryKeys.organization(orgId),
    queryFn: () => api.getOrganization(orgId),
    enabled: !!orgId,
  });
}

export function useEmployees(orgId: string) {
  return useQuery({
    queryKey: queryKeys.employees(orgId),
    queryFn: () => api.getEmployees(orgId),
    enabled: !!orgId,
  });
}

export function useEmployee(orgId: string) {
  return useQuery({
    queryKey: queryKeys.employee(orgId),
    queryFn: () => api.getEmployee(orgId),
    enabled: !!orgId,
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.userProfile,
    queryFn: () => api.getUserProfile(),
  });
}

export function useRoles(orgId: string) {
  return useQuery({
    queryKey: queryKeys.roles(orgId),
    queryFn: () => api.getRoles(orgId),
    enabled: !!orgId,
  });
}

export function useSchedules(orgId: string, type?: 'TEMPLATE' | 'DRAFT' | 'PUBLISHED') {
  return useQuery({
    queryKey: queryKeys.schedules(orgId, type),
    queryFn: () => api.getSchedules(orgId, type),
    enabled: !!orgId,
  });
}

export function useSchedule(scheduleId: string) {
  return useQuery({
    queryKey: queryKeys.schedule(scheduleId),
    queryFn: () => api.getSchedule(scheduleId),
    enabled: !!scheduleId,
  });
}

export function useActiveSchedule(orgId: string) {
  return useQuery({
    queryKey: queryKeys.activeSchedule(orgId),
    queryFn: () => api.getActiveSchedule(orgId),
    enabled: !!orgId,
  });
}

export function useAvailability(orgId: string) {
  return useQuery({
    queryKey: queryKeys.availability(orgId),
    queryFn: () => api.getAllOrgAvailability(orgId),
    enabled: !!orgId,
  });
}

export function useMyOrgAvailability(orgId: string) {
  return useQuery({
    queryKey: queryKeys.myOrgAvailability(orgId),
    queryFn: () => api.getMyOrgAvailability(orgId),
    enabled: !!orgId,
  });
}

export function useMyGeneralAvailability() {
  return useQuery({
    queryKey: queryKeys.myGeneralAvailability,
    queryFn: () => api.getMyGeneralAvailability(),
  });
}

export function useShiftConflicts(orgId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.shiftConflicts(orgId, startDate, endDate),
    queryFn: () => api.getShiftConflicts(orgId, startDate, endDate),
    enabled: !!orgId && !!startDate && !!endDate,
  });
}

// --- MUTATIONS ---

export function usePublishSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) => api.publishSchedule(scheduleId),
    onSuccess: (_, scheduleId) => {
      // Invalidate schedule queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.schedule(scheduleId) });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useSaveTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scheduleId, data }: { scheduleId: string; data: any }) =>
      api.saveAsTemplate(scheduleId, data),
    onSuccess: (_, { scheduleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedule(scheduleId) });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}

export function useBulkUpdateShifts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scheduleId, data }: { scheduleId: string; data: any }) =>
      api.bulkUpdateShifts(scheduleId, data),
    onSuccess: (_, { scheduleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedule(scheduleId) });
    },
  });
}

export function useUpdateScheduleDays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scheduleId, data }: { scheduleId: string; data: any }) =>
      api.updateScheduleDays(scheduleId, data),
    onSuccess: (_, { scheduleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedule(scheduleId) });
    },
  });
}
