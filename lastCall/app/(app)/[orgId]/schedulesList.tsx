import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CalendarDays,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react-native';
import { api } from '@/lib/api';
import type { ScheduleWithCounts } from '@/types/api';
import { formatWeekDate, getNextMonday, getNextMondays } from '@/lib/helper';

export default function SchedulesList() {
  const router = useRouter();
  const { orgId } = useLocalSearchParams();

  const [schedules, setSchedules] = useState<ScheduleWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const [isDatePickerExpanded, setIsDatePickerExpanded] = useState(false);
  const [availableMondays, setAvailableMondays] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [orgId]);

  useEffect(() => {
    setAvailableMondays(getNextMondays(8));
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await api.getSchedules(orgId as string);
      // Sort by weekStartDate descending (most recent first)
      const sorted = data.sort((a, b) =>
        new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()
      );
      setSchedules(sorted);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules();
  };

  const handleSchedulePress = (scheduleId: string) => {
    router.push(`/(app)/${orgId}/schedules?scheduleId=${scheduleId}`);
  };

  const handleCreateNew = () => {
    setIsCreateModalOpen(true);
  };

  const createSchedule = async () => {
    try {
      setCreating(true);
      const weekStart = selectedWeekStart || getNextMonday();
      const startDate = new Date(weekStart);
      const deadlineDate = new Date(startDate);
      deadlineDate.setDate(deadlineDate.getDate() - 3);
      const availabilityDeadline = deadlineDate.toISOString().split('T')[0];

      const newSchedule = await api.createSchedule(orgId as string, {
        name: scheduleName || undefined,
        weekStartDate: weekStart,
        availabilityDeadline,
        operatingDays: [] // Start with no days, user will add them in editor
      });

      // Reset modal state
      setIsCreateModalOpen(false);
      setScheduleName('');
      setSelectedWeekStart(null);
      setIsDatePickerExpanded(false);

      // Navigate to editor
      router.push(`/(app)/${orgId}/schedules?scheduleId=${newSchedule.id}`);
    } catch (error) {
      console.error('Failed to create schedule:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Schedules</Text>
          <Text style={styles.subtitle}>Manage weekly schedules</Text>
        </View>
      </View>

      {/* Schedules List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />
        }
      >
        {schedules.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarDays size={48} color="#475569" />
            <Text style={styles.emptyText}>No schedules yet</Text>
            <Text style={styles.emptySubtext}>Create your first weekly schedule</Text>
          </View>
        ) : (
          schedules.map((schedule) => (
            <TouchableOpacity
              key={schedule.id}
              style={styles.scheduleCard}
              activeOpacity={0.7}
              onPress={() => handleSchedulePress(schedule.id)}
            >
              <View style={styles.scheduleIconBubble}>
                <CalendarDays size={24} color="#fff" />
              </View>
              <View style={styles.scheduleCardContent}>
                <Text style={styles.scheduleName}>
                  {schedule.name || formatWeekDate(schedule.weekStartDate)}
                </Text>
                {schedule.name && (
                  <Text style={styles.scheduleDate}>
                    {formatWeekDate(schedule.weekStartDate)}
                  </Text>
                )}
                <View style={styles.scheduleMetaRow}>
                  {schedule.isPublished ? (
                    <View style={styles.publishedBadge}>
                      <CheckCircle2 size={12} color="#34d399" />
                      <Text style={styles.publishedText}>Published</Text>
                    </View>
                  ) : (
                    <View style={styles.draftBadge}>
                      <Clock size={12} color="#94a3b8" />
                      <Text style={styles.draftText}>Draft</Text>
                    </View>
                  )}
                  <Text style={styles.scheduleDays}>
                    {schedule._count.scheduleDays} {schedule._count.scheduleDays === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#475569" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB: Create New Schedule */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateNew}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Create Schedule Modal */}
      <Modal visible={isCreateModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Schedule</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsCreateModalOpen(false);
                  setScheduleName('');
                  setSelectedWeekStart(null);
                  setIsDatePickerExpanded(false);
                }}
                style={styles.closeButton}
              >
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputSection}>
                <Text style={styles.label}>Schedule Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Holiday Week, Regular Schedule"
                  placeholderTextColor="#64748b"
                  value={scheduleName}
                  onChangeText={setScheduleName}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Week Start Date</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setIsDatePickerExpanded(!isDatePickerExpanded)}
                >
                  <CalendarDays size={20} color="#94a3b8" />
                  <Text style={styles.datePickerText}>
                    {selectedWeekStart
                      ? formatWeekDate(selectedWeekStart)
                      : `Next Monday: ${formatWeekDate(getNextMonday())}`}
                  </Text>
                  <ChevronRight
                    size={20}
                    color="#64748b"
                    style={{
                      transform: [{ rotate: isDatePickerExpanded ? '90deg' : '0deg' }],
                    }}
                  />
                </TouchableOpacity>

                {/* Inline Date Picker - Expands when clicked */}
                {isDatePickerExpanded && (
                  <ScrollView style={styles.datePickerInline}>
                    {availableMondays.map((monday) => (
                      <TouchableOpacity
                        key={monday}
                        style={[
                          styles.dateOption,
                          selectedWeekStart === monday && styles.dateOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedWeekStart(monday);
                          setIsDatePickerExpanded(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dateOptionText,
                            selectedWeekStart === monday && styles.dateOptionTextSelected,
                          ]}
                        >
                          {formatWeekDate(monday)}
                        </Text>
                        {selectedWeekStart === monday && (
                          <CheckCircle2 size={20} color="#34d399" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsCreateModalOpen(false);
                  setScheduleName('');
                  setSelectedWeekStart(null);
                  setIsDatePickerExpanded(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={createSchedule}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.createButtonText}>Create & Edit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },

  // List
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for FAB
  },
  scheduleCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scheduleIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scheduleCardContent: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  scheduleDate: {
    fontSize: 13,
    color: '#64748b',
    marginTop: -4,
    marginBottom: 6,
  },
  scheduleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  publishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publishedText: {
    fontSize: 12,
    color: '#34d399',
    fontWeight: '600',
  },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  draftText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  scheduleDays: {
    fontSize: 12,
    color: '#64748b',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  datePickerButton: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  createButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  datePickerInline: {
    maxHeight: 300,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  dateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  dateOptionSelected: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#cbd5e1',
  },
  dateOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
