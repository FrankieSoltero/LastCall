import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Plus,
    Save,
    User,
    AlertCircle,
    Phone,
    Trash2,
    Send, // Added for Publish icon
    X
} from 'lucide-react-native';
import { api } from '@/lib/api';
import type {
    Role,
    AvailabilityWithFallback,
} from '@/types/api';
import { dateToDay, dayToFullName, calculateDateForDay, isEmployeeAvailableForShift, formatWeekDate } from '@/lib/helper';

// --- Local Types (Extended from API types) ---

// Extended employee type with calculated fields
type EmployeeDisplay = {
    id: string;
    name: string;
    roleIds: string[];
    shiftsThisWeek: number; // Calculated from current schedule
    isAvailable: boolean; // Checked against availability API
};

// Local shift representation (before saving)
type LocalShift = {
    id: string; // Backend UUID for existing shifts, temp ID for new shifts
    roleId: string;
    roleName: string;
    startTime: string; // "17:00"
    endTime: string | null;   // "02:00" or null
    assignedEmployeeId: string | null;
    isOnCall: boolean;
};

// Data structure holding the whole week
type WeeklySchedule = Record<string, LocalShift[]>;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ScheduleEditor() {
    const router = useRouter();
    const { orgId, scheduleId } = useLocalSearchParams();

    // --- State ---
    const [selectedDay, setSelectedDay] = useState('Fri'); // Default to a busy day
    const [scheduleData, setScheduleData] = useState<WeeklySchedule>({
        Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
    });

    // Modals
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [isStaffingModalOpen, setIsStaffingModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    // Selection Tracking
    const [activeShiftId, setActiveShiftId] = useState<string | null>(null);

    // Data State
    const [roles, setRoles] = useState<Role[]>([]);
    const [employees, setEmployees] = useState<EmployeeDisplay[]>([]);
    const [availabilityMap, setAvailabilityMap] = useState<Map<string, AvailabilityWithFallback[]>>(new Map());
    const [loading, setLoading] = useState(true);
    const [weekStartDate, setWeekStartDate] = useState<string>("");
    const [existingOperatingDays, setExistingOperatingDays] = useState<string[]>([]); // Track which days already exist

    // Form State for "New Shift"
    const [newShiftRole, setNewShiftRole] = useState<Role | null>(null);
    const [newShiftStart, setNewShiftStart] = useState('11:00');
    const [newShiftEnd, setNewShiftEnd] = useState('20:00');
    
    // Publish State
    const [isPublishing, setIsPublishing] = useState(false);

    // Template State
    const [templateName, setTemplateName] = useState('');
    const [savingTemplate, setSavingTemplate] = useState(false);

    // --- 1. Load Data ---
    useEffect(() => {
        fetchData();
    }, [orgId]);

    // --- 2. Update shift counts in real-time when schedule changes ---
    useEffect(() => {
        if (employees.length === 0) return;

        // Recalculate shift counts for all employees
        const updatedEmployees = employees.map(emp => ({
            ...emp,
            shiftsThisWeek: Object.values(scheduleData)
                .flat()
                .filter(shift => shift.assignedEmployeeId === emp.id)
                .length
        }));

        // Only update if counts actually changed to avoid infinite loop
        const countsChanged = updatedEmployees.some((emp, idx) =>
            emp.shiftsThisWeek !== employees[idx].shiftsThisWeek
        );

        if (countsChanged) {
            setEmployees(updatedEmployees);
        }
    }, [scheduleData]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch roles, employees, and availability in parallel
            const [rolesData, employeesData, allAvailability] = await Promise.all([
                api.getRoles(orgId as string),
                api.getEmployees(orgId as string),
                api.getAllOrgAvailability(orgId as string)
            ]);

            // Build availability map: employeeId -> AvailabilityWithFallback[]
            const availMap = new Map<string, AvailabilityWithFallback[]>();
            allAvailability.forEach(avail => {
                if (!availMap.has(avail.employee.id)) {
                    availMap.set(avail.employee.id, []);
                }
                availMap.get(avail.employee.id)!.push(avail);
            });
            setAvailabilityMap(availMap);

            // If editing an existing schedule, load it
            let loadedScheduleData: WeeklySchedule = {
                Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
            };

            const schedule = await api.getSchedule(scheduleId as string);
            setWeekStartDate(schedule.weekStartDate || "");

            // Track existing operating days (from backend)
            setExistingOperatingDays(schedule.operatingDays || []);

            // Transform ScheduleDetail to WeeklySchedule format
            schedule.scheduleDays.forEach(day => {
                // Convert date to day abbreviation (e.g., "2025-01-06" -> "Mon")
                const dayKey = dateToDay(day.date);
                loadedScheduleData[dayKey] = day.shifts.map(shift => ({
                    id: shift.id,
                    roleId: shift.role.id,
                    roleName: shift.role.name,
                    startTime: shift.startTime.substring(11,16),
                    endTime: shift.endTime?.substring(11,16) || '',
                    assignedEmployeeId: shift.employee?.id || null,
                    isOnCall: shift.isOnCall
                }));
            });

            setScheduleData(loadedScheduleData);

            // Transform employees to include roleIds and calculated fields
            const transformedEmployees: EmployeeDisplay[] = employeesData.map(emp => {
                const roleIds = (emp as any).roleAssignments?.map((ra: any) => ra.roleId) || [];

                // Calculate shifts for this week from current local schedule state
                const currentSchedule = scheduleId ? loadedScheduleData : scheduleData;
                const shiftsThisWeek = Object.values(currentSchedule)
                    .flat()
                    .filter(shift => shift.assignedEmployeeId === emp.id)
                    .length;

                return {
                    id: emp.id,
                    name: `${emp.user.firstName} ${emp.user.lastName}`,
                    roleIds,
                    shiftsThisWeek,
                    isAvailable: true // Will be checked dynamically per shift
                };
            });

            setRoles(rolesData);
            setEmployees(transformedEmployees);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            Alert.alert('Error', 'Failed to load schedule data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    // --- 2. Logic Helpers ---

    const addShift = () => {
        if (!newShiftRole) return;

        const newShift: LocalShift = {
            id: Math.random().toString(36).substr(2, 9),
            roleId: newShiftRole.id,
            roleName: newShiftRole.name,
            startTime: newShiftStart,
            endTime: newShiftEnd,
            assignedEmployeeId: null,
            isOnCall: false,
        };

        setScheduleData(prev => ({
            ...prev,
            [selectedDay]: [...prev[selectedDay], newShift]
        }));

        setIsShiftModalOpen(false);
        setNewShiftRole(null);
    };

    const assignEmployee = (employeeId: string, isOnCall: boolean) => {
        if (!activeShiftId) return;

        setScheduleData(prev => ({
            ...prev,
            [selectedDay]: prev[selectedDay].map(s =>
                s.id === activeShiftId
                    ? { ...s, assignedEmployeeId: employeeId, isOnCall }
                    : s
            )
        }));

        setIsStaffingModalOpen(false);
        setActiveShiftId(null);
    };

    const removeAssignment = () => {
        if (!activeShiftId) return;
        setScheduleData(prev => ({
            ...prev,
            [selectedDay]: prev[selectedDay].map(s =>
                s.id === activeShiftId
                    ? { ...s, assignedEmployeeId: null, isOnCall: false }
                    : s
            )
        }));
        setIsStaffingModalOpen(false);
    };

    const removeShift = () => {
        if (!activeShiftId) return;

        setScheduleData(prev => ({
            ...prev,
            [selectedDay]: prev[selectedDay].filter(s => s.id !== activeShiftId)
        }))
        setIsStaffingModalOpen(false);
    }

    // --- SAVE LOGIC ---
    const saveTemplate = async () => {
        try {
            if (!scheduleId || !weekStartDate) {
                Alert.alert('Error', 'Schedule not loaded properly');
                return;
            }

            // Step 1: Determine which days have shifts
            const daysWithShifts = DAYS.filter(day => scheduleData[day].length > 0);
            const operatingDays = daysWithShifts.map(day => dayToFullName(day));

            // Step 2: Only add NEW days that don't already exist
            const newDays = operatingDays.filter(day => !existingOperatingDays.includes(day));
            if (newDays.length > 0) {
                await api.updateScheduleDays(scheduleId as string, {
                    addDays: newDays
                });
            }

            // Step 3: Reload schedule to get updated scheduleDays with IDs
            const updatedSchedule = await api.getSchedule(scheduleId as string);

            // Step 4: Collect ALL shift IDs that need to be deleted
            const shiftsToDelete: string[] = [];
            updatedSchedule.scheduleDays.forEach(scheduleDay => {
                if (scheduleDay.shifts) {
                    scheduleDay.shifts.forEach(shift => {
                        shiftsToDelete.push(shift.id);
                    });
                }
            });

            // Step 5: Prepare all shift creations
            const shiftsToCreate: any[] = [];
            for (const dayKey of DAYS) {
                const shiftsForDay = scheduleData[dayKey];
                if (shiftsForDay.length > 0) {
                    const shiftDate = calculateDateForDay(weekStartDate, dayKey);
                    const scheduleDay = updatedSchedule.scheduleDays.find(sd => sd.date === shiftDate);

                    if (!scheduleDay) {
                        console.error(`Could not find schedule day for ${dayKey} (${shiftDate})`);
                        continue;
                    }

                    shiftsForDay.forEach(shift => {
                        shiftsToCreate.push({
                            scheduleDayId: scheduleDay.id,
                            roleId: shift.roleId,
                            startTime: shift.startTime,
                            ...(shift.endTime && { endTime: shift.endTime }),
                            ...(shift.assignedEmployeeId && { employeeId: shift.assignedEmployeeId }),
                            isOnCall: shift.isOnCall
                        });
                    });
                }
            }

            // Step 6: Execute bulk update in a single API call
            await api.bulkUpdateShifts(scheduleId as string, {
                delete: shiftsToDelete,
                create: shiftsToCreate
            });

            setIsSaveModalOpen(false);
            Alert.alert(
                'Success',
                `Schedule saved for week of ${weekStartDate.substring(0, 10)}`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.push(`/(app)/${orgId}/schedulesList`)
                    }
                ]
            );
        } catch (error) {
            console.error('Failed to save schedule:', error);
            Alert.alert('Error', 'Failed to save schedule. Please try again.');
        }
    };

    // --- SAVE AS TEMPLATE LOGIC ---
    const saveAsTemplate = async () => {
        if (!templateName.trim()) {
            Alert.alert('Error', 'Please enter a template name');
            return;
        }

        try {
            setSavingTemplate(true);
            // First save the draft
            await saveTemplate();

            // Then convert to template
            await api.saveAsTemplate(scheduleId as string, {
                templateName: templateName.trim()
            });

            setIsSaveModalOpen(false);
            setTemplateName('');
            Alert.alert(
                'Success',
                'Template created successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.push(`/(app)/${orgId}/schedulesList`)
                    }
                ]
            );
        } catch (error) {
            console.error('Failed to save template:', error);
            Alert.alert('Error', 'Failed to save template. Please try again.');
        } finally {
            setSavingTemplate(false);
        }
    };

    // --- PUBLISH LOGIC ---
    const handlePublish = async () => {
        Alert.alert(
            "Publish Schedule",
            "Are you sure you want to publish this schedule? All assigned employees will be notified.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Publish Now",
                    style: "default",
                    onPress: async () => {
                        setIsPublishing(true);
                        try {
                            await api.publishSchedule(scheduleId as string);

                            Alert.alert("Published", "Schedule is now live!", [
                                { text: "OK", onPress: () => router.push(`/(app)/${orgId}/schedulesList`) }
                            ]);
                        } catch (error) {
                            console.error("Publish failed", error);
                            Alert.alert("Error", "Failed to publish schedule.");
                        } finally {
                            setIsPublishing(false);
                        }
                    }
                }
            ]
        );
    };

    // --- 3. Sorting Logic ---
    const getStaffingCandidates = () => {
        if (!activeShiftId) return { available: [], fallback: [] };

        const shift = scheduleData[selectedDay].find(s => s.id === activeShiftId);
        if (!shift) return { available: [], fallback: [] };

        // 1. Filter by Role
        const qualified = employees.filter(e => e.roleIds.includes(shift.roleId));

        // 2. Split by Availability - check dynamically based on day and shift time
        const fullDayName = dayToFullName(selectedDay);
        const available = qualified.filter(emp => {
            const empAvail = availabilityMap.get(emp.id) || [];
            return isEmployeeAvailableForShift(empAvail, fullDayName, shift.startTime, shift.endTime);
        });
        const fallback = qualified.filter(emp => {
            const empAvail = availabilityMap.get(emp.id) || [];
            return !isEmployeeAvailableForShift(empAvail, fullDayName, shift.startTime, shift.endTime);
        });

        // 3. Sort Fallback by Least Shifts (Requirement #5)
        fallback.sort((a, b) => a.shiftsThisWeek - b.shiftsThisWeek);

        return { available, fallback };
    };

    const { available, fallback } = getStaffingCandidates();

    // --- 4. Render ---

    return (
        <SafeAreaView style={styles.container}>

            {/* Top Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <ArrowLeft size={24} color="#94a3b8" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Edit Schedule</Text>
                    <Text style={styles.subtitle}>
                        {formatWeekDate(weekStartDate)}
                    </Text>
                </View>
                
                {/* Actions Group */}
                <View style={styles.headerActions}>
                    {/* Save Button */}
                    <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={() => setIsSaveModalOpen(true)}
                    >
                        <Save size={18} color="#ffffff" />
                        <Text style={styles.btnText}>Save</Text>
                    </TouchableOpacity>

                    {/* Publish Button (New) */}
                    <TouchableOpacity
                        style={styles.publishBtn}
                        onPress={() => handlePublish()}
                        disabled={isPublishing}
                    >
                        {isPublishing ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Send size={18} color="#ffffff" />
                                <Text style={styles.btnText}>Publish</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Day Strip (Requirement #1) */}
            <View style={styles.dayStrip}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {DAYS.map(day => {
                        const isActive = day === selectedDay;
                        const count = scheduleData[day].length;
                        return (
                            <TouchableOpacity
                                key={day}
                                style={[styles.dayTab, isActive && styles.dayTabActive]}
                                onPress={() => setSelectedDay(day)}
                            >
                                <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>{day}</Text>
                                {count > 0 && <View style={styles.dayDot} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Main Canvas */}
            {/* Day Header - Sticky */}
            <View style={styles.dayHeader}>
                <Text style={styles.sectionTitle}>{`${dayToFullName(selectedDay)}'s Shifts`}</Text>
                <TouchableOpacity
                    style={styles.addShiftBtn}
                    onPress={() => setIsShiftModalOpen(true)}
                >
                    <Plus size={16} color="#ffffff" />
                    <Text style={styles.addShiftText}>Add Shift</Text>
                </TouchableOpacity>
            </View>

            {/* Shift List - Scrollable */}
            <ScrollView contentContainerStyle={styles.canvas}>
                {scheduleData[selectedDay].length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No shifts scheduled for {dayToFullName(selectedDay)}.</Text>
                    </View>
                ) : (
                    scheduleData[selectedDay].map((shift) => {
                        const assignedEmp = employees.find(e => e.id === shift.assignedEmployeeId);

                        return (
                            <TouchableOpacity
                                key={shift.id}
                                style={styles.shiftCard}
                                onPress={() => {
                                    setActiveShiftId(shift.id);
                                    setIsStaffingModalOpen(true);
                                }}
                            >
                                {/* Time & Role Stripe */}
                                <View style={styles.shiftMeta}>
                                    <Text style={styles.shiftTime}>{shift.startTime} - {shift.endTime}</Text>
                                    <Text style={styles.shiftRole}>{shift.roleName}</Text>
                                </View>

                                {/* Assignment Slot */}
                                <View style={[styles.slot, assignedEmp ? styles.slotFilled : styles.slotEmpty]}>
                                    {assignedEmp ? (
                                        <View style={styles.assignedContent}>
                                            <User size={16} color="#ffffff" />
                                            <Text style={styles.assignedName}>{assignedEmp.name}</Text>
                                            {shift.isOnCall && (
                                                <View style={styles.onCallBadge}>
                                                    <Phone size={10} color="#020617" />
                                                    <Text style={styles.onCallText}>ON CALL</Text>
                                                </View>
                                            )}
                                        </View>
                                    ) : (
                                        <View style={styles.emptyContent}>
                                            <Text style={styles.emptySlotText}>Tap to Assign</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* --- MODAL 1: Create Shift (Requirement #2) --- */}
            <Modal visible={isShiftModalOpen} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Add Shift</Text>

                        <Text style={styles.label}>Role</Text>
                        <View style={styles.rolePicker}>
                            {roles.map(r => (
                                <TouchableOpacity
                                    key={r.id}
                                    style={[styles.roleChip, newShiftRole?.id === r.id && styles.roleChipActive]}
                                    onPress={() => setNewShiftRole(r)}
                                >
                                    <Text style={[styles.roleChipText, newShiftRole?.id === r.id && styles.roleChipTextActive]}>
                                        {r.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Start</Text>
                                <TextInput style={styles.input} value={newShiftStart} onChangeText={setNewShiftStart} />
                            </View>
                            <View style={{ width: 16 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>End</Text>
                                <TextInput style={styles.input} value={newShiftEnd} onChangeText={setNewShiftEnd} />
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setIsShiftModalOpen(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={addShift}
                                style={[styles.confirmBtn, !newShiftRole && styles.disabledBtn]}
                                disabled={!newShiftRole}
                            >
                                <Text style={styles.confirmText}>Add Shift</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* --- MODAL 2: Staffing (Requirements #3, #4, #5) --- */}
            <Modal visible={isStaffingModalOpen} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.sheetContainer}>
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>Assign Staff</Text>
                        <TouchableOpacity onPress={() => setIsStaffingModalOpen(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.sheetContent}>

                        {/* 1. Available Candidates */}
                        <Text style={styles.groupLabel}>Available</Text>
                        {available.length > 0 ? (
                            available.map(emp => (
                                <EmployeeRow
                                    key={emp.id}
                                    employee={emp}
                                    onAssign={(onCall) => assignEmployee(emp.id, onCall)}
                                />
                            ))
                        ) : (
                            <Text style={styles.emptyGroupText}>No qualified staff marked available.</Text>
                        )}

                        {/* 2. Fallback Candidates (Sorted by Least Shifts) */}
                        <View style={styles.fallbackHeader}>
                            <AlertCircle size={14} color="#e5b454" />
                            <Text style={[styles.groupLabel, { color: '#e5b454', marginBottom: 0 }]}>Unavailable / Other</Text>
                        </View>
                        <Text style={styles.helperText}>Sorted by least shifts this week.</Text>

                        {fallback.map(emp => (
                            <EmployeeRow
                                key={emp.id}
                                employee={emp}
                                isFallback
                                onAssign={(onCall) => assignEmployee(emp.id, onCall)}
                            />
                        ))}

                        {/* Remove Assignment Option */}
                        <TouchableOpacity style={styles.removeAssignmentBtn} onPress={removeAssignment}>
                            <Trash2 size={16} color="#ef4444" />
                            <Text style={styles.removeAssignmentText}>Clear Assignment</Text>
                        </TouchableOpacity>
                    </ScrollView>
                    <TouchableOpacity style={styles.removeShiftBtn} onPress={removeShift}>
                        <Trash2 size={16} color="#ef4444" />
                        <Text style={styles.removeShiftText}>Delete Shift</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* --- MODAL 3: Save Schedule --- */}
            <Modal visible={isSaveModalOpen} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {/* Modal Header with X button */}
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>Save Schedule</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsSaveModalOpen(false);
                                    setTemplateName('');
                                }}
                                style={styles.closeBtn}
                            >
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalDesc}>
                            Save this schedule as a draft or create a reusable template.
                        </Text>

                        {/* Template Name Input */}
                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Template Name (for "Save as Template")</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Regular Week, Holiday Schedule"
                                placeholderTextColor="#64748b"
                                value={templateName}
                                onChangeText={setTemplateName}
                            />
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                onPress={saveTemplate}
                                style={[styles.confirmBtn, styles.draftBtn]}
                            >
                                <Text style={styles.confirmText}>Save as Draft</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={saveAsTemplate}
                                style={[styles.confirmBtn, !templateName.trim() && styles.disabledBtn]}
                                disabled={savingTemplate || !templateName.trim()}
                            >
                                {savingTemplate ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.confirmText}>Save as Template</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

// Helper: Employee Row in Staffing Modal
function EmployeeRow({
    employee,
    isFallback,
    onAssign
}: {
    employee: EmployeeDisplay,
    isFallback?: boolean,
    onAssign: (onCall: boolean) => void
}) {
    return (
        <View style={styles.empRow}>
            <View style={styles.empInfo}>
                <Text style={[styles.empName, isFallback && styles.empNameDim]}>{employee.name}</Text>
                <Text style={styles.empMeta}>
                    {employee.shiftsThisWeek} shifts • {isFallback ? 'Unavailable' : 'Available'}
                </Text>
            </View>

            <View style={styles.empActions}>
                {/* On Call Button */}
                <TouchableOpacity
                    style={styles.actionBtnSec}
                    onPress={() => onAssign(true)}
                >
                    <Phone size={14} color="#94a3b8" />
                </TouchableOpacity>

                {/* Assign Button */}
                <TouchableOpacity
                    style={styles.actionBtnPri}
                    onPress={() => onAssign(false)}
                >
                    <Text style={styles.actionBtnText}>Assign</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
    iconBtn: { padding: 8, marginRight: 8 },
    headerText: { flex: 1 },
    title: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
    subtitle: { fontSize: 13, color: '#94a3b8' },
    
    // Header Actions
    headerActions: { flexDirection: 'row', gap: 8 },
    
    saveBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#4f46e5', // Indigo (Standard)
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        borderRadius: 8, 
        gap: 6 
    },
    publishBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#059669', // Emerald (Go Live)
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        borderRadius: 8, 
        gap: 6 
    },
    btnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },

    // Day Strip
    dayStrip: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', backgroundColor: '#0f172a' },
    dayTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, backgroundColor: '#1e293b', minWidth: 60, alignItems: 'center' },
    dayTabActive: { backgroundColor: '#ffffff' },
    dayTabText: { color: '#94a3b8', fontWeight: '600' },
    dayTabTextActive: { color: '#020617' },
    dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4f46e5', marginTop: 4 },

    // Canvas
    canvas: { padding: 16, paddingTop: 8 },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: '#020617',
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b'
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
    addShiftBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
    addShiftText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
    emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: '#475569', fontStyle: 'italic' },

    // Shift Card
    shiftCard: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
    shiftMeta: { padding: 16, width: 100, backgroundColor: '#1e293b', justifyContent: 'center' },
    shiftTime: { color: '#ffffff', fontWeight: '700', fontSize: 14, marginBottom: 4 },
    shiftRole: { color: '#94a3b8', fontSize: 12 },
    slot: { flex: 1, padding: 12, justifyContent: 'center' },
    slotFilled: {},
    slotEmpty: { alignItems: 'center' },
    emptyContent: { paddingVertical: 8 },
    emptySlotText: { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
    assignedContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    assignedName: { color: '#ffffff', fontSize: 16, flex: 1 },
    onCallBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e5b454', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
    onCallText: { color: '#020617', fontSize: 10, fontWeight: '800' },

    // Modal Common
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#334155' },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 16 },
    modalDesc: { color: '#94a3b8', marginBottom: 16 },
    row: { flexDirection: 'row' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
    cancelBtn: { padding: 12 },
    cancelText: { color: '#94a3b8', fontWeight: '600' },
    confirmBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
    disabledBtn: { backgroundColor: '#1e293b', opacity: 0.5 },
    confirmText: { color: '#ffffff', fontWeight: '600' },

    // Role Picker
    rolePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    roleChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
    roleChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
    roleChipText: { color: '#94a3b8' },
    roleChipTextActive: { color: '#ffffff', fontWeight: '600' },

    // Staffing Sheet
    sheetContainer: { flex: 1, backgroundColor: '#020617' },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
    closeText: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
    sheetContent: { padding: 24 },
    groupLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
    emptyGroupText: { color: '#475569', fontStyle: 'italic', marginBottom: 24 },
    fallbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 4 },
    helperText: { color: '#64748b', fontSize: 12, marginBottom: 16 },

    // Employee Row
    empRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
    empInfo: { flex: 1 },
    empName: { color: '#ffffff', fontSize: 16 },
    empNameDim: { color: '#94a3b8' },
    empMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
    empActions: { flexDirection: 'row', gap: 8 },
    actionBtnSec: { width: 40, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
    actionBtnPri: { height: 36, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: '#4f46e5' },
    actionBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },

    removeAssignmentBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, padding: 16, gap: 8, opacity: 0.8 },
    removeAssignmentText: { color: '#ef4444', fontWeight: '600' },
    removeShiftBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, padding: 16, gap: 8, opacity: 0.8, marginBottom: 32 },
    removeShiftText: { color: '#ef4444', fontWeight: '600' },

    // Schedule Creation Inputs
    inputSection: {
        marginBottom: 16,
    },
    label: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 8,
        padding: 12,
        color: '#ffffff',
        fontSize: 16,
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#020617',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Modal Header Row with X
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    closeBtn: {
        padding: 4,
    },

    // Draft Button Style
    draftBtn: {
        backgroundColor: '#64748b', // Gray for draft
    },
});