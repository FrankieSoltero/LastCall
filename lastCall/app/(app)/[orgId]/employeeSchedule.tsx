import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Calendar,
    User,
    Phone,
} from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { dateToDay } from '@/lib/helper';

// --- Types ---
type Shift = {
    id: string;
    roleName: string;
    startTime: string; // "17:00"
    endTime: string;   // "02:00"
    employeeName: string;
    employeeId: string;
    isOnCall: boolean;
};

// Data structured by Day
type WeeklySchedule = Record<string, Shift[]>;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function EmployeeSchedule() {
    const router = useRouter();
    const { orgId } = useLocalSearchParams();
    const { user } = useAuth();

    const currentUserId = user?.id || '';

    // --- State ---
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [scheduleData, setScheduleData] = useState<WeeklySchedule>({});
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [weekRange, setWeekRange] = useState("Jan 22 - Jan 28");

    // Filters
    const [selectedDay, setSelectedDay] = useState('Mon');
    const [selectedRole, setSelectedRole] = useState<string | null>(null); // null = All Roles

    // --- 1. Load Data ---
    const fetchSchedule = async () => {
        try {
            console.log(`Fetching latest published schedule for org: ${orgId}`);

            // Fetch the most recent published schedule
            const activeSchedule = await api.getActiveSchedule(orgId as string);

            // Calculate week range for display (e.g., "Jan 22 - Jan 28")
            const startDate = new Date(activeSchedule.weekStartDate);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6); // End of week

            const formatDate = (date: Date) => {
                const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
                return date.toLocaleDateString('en-US', options);
            };

            setWeekRange(`${formatDate(startDate)} - ${formatDate(endDate)}`);

            // Transform backend data to WeeklySchedule format
            const weeklyData: WeeklySchedule = {
                Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
            };

            activeSchedule.scheduleDays.forEach(scheduleDay => {
                const dayKey = dateToDay(scheduleDay.date); // Convert "2025-01-20" -> "Mon"

                scheduleDay.shifts.forEach(shift => {
                    const employeeName = shift.employee
                        ? `${shift.employee.user.firstName} ${shift.employee.user.lastName}`
                        : 'Unassigned';

                    weeklyData[dayKey].push({
                        id: shift.id,
                        roleName: shift.role.name,
                        startTime: shift.startTime.substring(11, 16), // "2024-01-01T17:00:00Z" -> "17:00"
                        endTime: shift.endTime?.substring(11, 16) || '',
                        employeeName,
                        employeeId: shift.employee?.id || '',
                        isOnCall: shift.isOnCall
                    });
                });
            });

            setScheduleData(weeklyData);

            // Extract unique roles for the filter list
            const allRoles = new Set<string>();
            Object.values(weeklyData).flat().forEach(s => allRoles.add(s.roleName));
            setAvailableRoles(Array.from(allRoles).sort());

        } catch (error: any) {
            if (error.message?.includes('No published schedule found')) {
                // Handle gracefully - show empty state
                setScheduleData({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] });
                setWeekRange('No active schedule');
            } else {
                console.error("Failed to load schedule", error);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSchedule();
    };

    // --- 2. Filter Logic ---
    const getDisplayShifts = () => {
        let shifts = scheduleData[selectedDay] || [];

        // Filter by Role if selected
        if (selectedRole) {
            shifts = shifts.filter(s => s.roleName === selectedRole);
        }

        // Sort: "My" shifts first, then by time
        return shifts.sort((a, b) => {
            const isMeA = a.employeeId === currentUserId;
            const isMeB = b.employeeId === currentUserId;
            if (isMeA && !isMeB) return -1;
            if (!isMeA && isMeB) return 1;
            return a.startTime.localeCompare(b.startTime);
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }
    const displayedShifts = getDisplayShifts();

    // --- 3. Render ---
    return (
        <SafeAreaView style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#94a3b8" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Weekly Schedule</Text>
                    <Text style={styles.subtitle}>{weekRange}</Text>
                </View>
                <View style={styles.headerIconBox}>
                    <Calendar size={20} color="#4f46e5" />
                </View>
            </View>

            {/* 1. Day Strip (Navigation) */}
            <View style={styles.dayStrip}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                    {DAYS.map(day => {
                        const isActive = day === selectedDay;
                        // Check if user works this day (for the little dot)
                        const hasMyShift = scheduleData[day]?.some(s => s.employeeId === currentUserId);

                        return (
                            <TouchableOpacity
                                key={day}
                                style={[styles.dayTab, isActive && styles.dayTabActive]}
                                onPress={() => setSelectedDay(day)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>{day}</Text>
                                {hasMyShift && <View style={styles.myShiftDot} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* 2. Role Filter Strip */}
            <View style={styles.filterStrip}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                    {/* "All" Option */}
                    <TouchableOpacity
                        style={[styles.filterChip, selectedRole === null && styles.filterChipActive]}
                        onPress={() => setSelectedRole(null)}
                    >
                        <Text style={[styles.filterText, selectedRole === null && styles.filterTextActive]}>
                            All Positions
                        </Text>
                    </TouchableOpacity>

                    {/* Dynamic Roles */}
                    {availableRoles.map(role => (
                        <TouchableOpacity
                            key={role}
                            style={[styles.filterChip, selectedRole === role && styles.filterChipActive]}
                            onPress={() => setSelectedRole(role)}
                        >
                            <Text style={[styles.filterText, selectedRole === role && styles.filterTextActive]}>
                                {role}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* 3. Shift List Content */}
            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />
                    }
                >
                    {displayedShifts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No Shifts Scheduled</Text>
                            <Text style={styles.emptyText}>
                                {selectedRole
                                    ? `No ${selectedRole}s scheduled for ${selectedDay}.`
                                    : `There are no shifts on the schedule for ${selectedDay}.`}
                            </Text>
                        </View>
                    ) : (
                        displayedShifts.map((shift) => {
                            const isMe = shift.employeeId === currentUserId;

                            return (
                                <View
                                    key={shift.id}
                                    style={[styles.shiftCard, isMe && styles.shiftCardMe]}
                                >
                                    {/* Visual Left Border for "Me" */}
                                    {isMe && <View style={styles.meIndicator} />}

                                    {/* Shift Time */}
                                    <View style={styles.timeSection}>
                                        <Text style={[styles.timeText, isMe && styles.textHighlight]}>
                                            {shift.startTime}
                                        </Text>
                                        <View style={styles.timeConnector} />
                                        <Text style={[styles.timeTextSec, isMe && styles.textHighlight]}>
                                            {shift.endTime}
                                        </Text>
                                    </View>

                                    {/* Shift Info */}
                                    <View style={styles.infoSection}>
                                        <View style={styles.roleRow}>
                                            <Text style={[styles.roleText, isMe && styles.textHighlight]}>
                                                {shift.roleName}
                                            </Text>
                                            {shift.isOnCall && (
                                                <View style={styles.onCallBadge}>
                                                    <Phone size={10} color="#020617" />
                                                    <Text style={styles.onCallText}>ON CALL</Text>
                                                </View>
                                            )}
                                        </View>

                                        <View style={styles.employeeRow}>
                                            <User size={14} color={isMe ? '#818cf8' : '#64748b'} />
                                            <Text style={[styles.employeeText, isMe && styles.employeeTextMe]}>
                                                {shift.employeeName}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}

                    {/* Bottom Padding */}
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8 },
    backButton: { padding: 8, marginLeft: -8, marginRight: 8 },
    headerContent: { flex: 1 },
    title: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
    subtitle: { fontSize: 13, color: '#94a3b8' },
    headerIconBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },

    // Day Strip
    dayStrip: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
    dayTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, backgroundColor: '#1e293b', minWidth: 60, alignItems: 'center' },
    dayTabActive: { backgroundColor: '#ffffff' },
    dayTabText: { color: '#94a3b8', fontWeight: '600' },
    dayTabTextActive: { color: '#020617' },
    myShiftDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4f46e5', marginTop: 4 },

    // Filter Strip
    filterStrip: { paddingVertical: 12, backgroundColor: '#0f172a' },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
    filterChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
    filterText: { color: '#94a3b8', fontSize: 13 },
    filterTextActive: { color: '#ffffff', fontWeight: '600' },

    // List
    listContent: { padding: 16 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Shift Card
    shiftCard: {
        flexDirection: 'row',
        backgroundColor: '#0f172a',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
        overflow: 'hidden',
        minHeight: 80
    },
    shiftCardMe: {
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        borderColor: '#4f46e5'
    },

    // Left: Indicator
    meIndicator: { width: 4, backgroundColor: '#4f46e5', height: '100%' },

    // Left: Time
    timeSection: {
        padding: 16,
        width: 85,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: '#1e293b'
    },
    timeText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
    timeTextSec: { color: '#94a3b8', fontSize: 13 },
    timeConnector: { width: 1, height: 8, backgroundColor: '#334155', marginVertical: 4 },

    // Right: Info
    infoSection: { flex: 1, padding: 16, justifyContent: 'center' },
    roleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
    roleText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },

    employeeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    employeeText: { color: '#94a3b8', fontSize: 14 },
    employeeTextMe: { color: '#818cf8', fontWeight: '600' },

    // Utility text highlights
    textHighlight: { color: '#ffffff' },

    // Badge
    onCallBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e5b454', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
    onCallText: { color: '#020617', fontSize: 10, fontWeight: '800' },

    // Empty State
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptyText: { color: '#64748b', textAlign: 'center', maxWidth: 250 },
});