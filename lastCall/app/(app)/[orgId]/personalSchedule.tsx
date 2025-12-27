import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Clock,
    Calendar,
    Moon,
    Sun
} from 'lucide-react-native';
import { api } from '@/lib/api';
import { useActiveSchedule, useEmployee } from '@/lib/queries';
import { dateToDay, dayToFullName } from '@/lib/helper';

// --- Types ---
type ShiftDisplay = {
    id: string;
    roleName: string;
    startTime: string; // "17:00"
    endTime: string;   // "02:00"
    location?: string; // Optional: e.g. "Main Bar"
};

type DaySchedule = {
    date: string;      // "2024-01-22"
    dayName: string;   // "Monday"
    shifts: ShiftDisplay[];
    isClosed?: boolean; // True if business is not operating this day
};

export default function MyShifts() {
    const router = useRouter();
    const { orgId } = useLocalSearchParams();

    // React Query hooks - automatic caching
    const { data: activeSchedule, isLoading: scheduleLoading, refetch: refetchSchedule, isRefetching: scheduleRefetching } = useActiveSchedule(orgId as string);
    const { data: currentEmployee, isLoading: employeeLoading, refetch: refetchEmployee, isRefetching: employeeRefetching } = useEmployee(orgId as string);

    const loading = scheduleLoading || employeeLoading;
    const refreshing = scheduleRefetching || employeeRefetching;

    // --- State ---
    const [weekData, setWeekData] = useState<DaySchedule[]>([]);
    const [totalShifts, setTotalShifts] = useState(0);
    const [weekRange, setWeekRange] = useState("");

    // --- Process schedule data when it loads ---
    useEffect(() => {
        if (!activeSchedule || !currentEmployee) return;

        try {
            // Handle template schedules (which don't have weekStartDate)
            if (!activeSchedule.weekStartDate) {
                throw new Error('No published schedule found for the current week');
            }

            // Calculate week range for display (e.g., "Jan 22 - Jan 28")
            // Extract date strings and format them to avoid timezone shifts
            const startDateStr = activeSchedule.weekStartDate.split('T')[0]; // "2025-01-22"
            const startDate = new Date(activeSchedule.weekStartDate);
            const endDate = new Date(startDate);
            endDate.setUTCDate(startDate.getUTCDate() + 6);
            const endDateStr = endDate.toISOString().split('T')[0];

            const formatDateString = (dateStr: string) => {
                // Parse as UTC to avoid timezone shifts
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(Date.UTC(year, month - 1, day));
                const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
                return date.toLocaleDateString('en-US', options);
            };

            setWeekRange(`${formatDateString(startDateStr)} - ${formatDateString(endDateStr)}`);
            const WeeklySchedule: DaySchedule[] = [];

            // Generate all 7 days of the week
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                const dateString = currentDate.toISOString().split('T')[0]; // "2025-01-20"

                // Find if this day exists in scheduleDays (is an operating day)
                const scheduleDay = activeSchedule.scheduleDays.find(sd => sd.date.split('T')[0] === dateString);
                if (scheduleDay) {
                    // Operating day - filter for user's shifts
                    const userShifts = scheduleDay.shifts.filter(shift => shift.employeeId === currentEmployee.id);
                    console.log(userShifts);
                    const transformedShifts: ShiftDisplay[] = userShifts.map(shift => {
                        const hour = parseInt(shift.startTime.substring(11, 13));
                        return {
                            id: shift.id,
                            roleName: shift.role.name,
                            startTime: shift.startTime.substring(11, 16),
                            endTime: shift.endTime?.substring(11, 16) || (hour >= 18 ? 'Closing' : 'Switch Over')
                        };
                    });

                    WeeklySchedule.push({
                        date: dateString,
                        dayName: dayToFullName(dateToDay(dateString)),
                        shifts: transformedShifts
                    });
                } else {
                    // Non-operating day - business is closed
                    WeeklySchedule.push({
                        date: dateString,
                        dayName: dayToFullName(dateToDay(dateString)),
                        shifts: [],
                        isClosed: true
                    });
                }
            }

            setWeekData(WeeklySchedule);
            const count = WeeklySchedule.reduce((acc, day) => acc + day.shifts.length, 0);
            setTotalShifts(count);

        } catch (error: any) {
            if (error.message?.includes('No published schedule found')) {
                // Handle gracefully - show empty state
                setWeekData([]);
                setWeekRange('No active schedule');
            } else {
                console.error("Failed to load schedule", error);
            }
        }
    }, [activeSchedule, currentEmployee]);

    const onRefresh = async () => {
        await Promise.all([refetchSchedule(), refetchEmployee()]);
    };

    // Helper to determine greeting based on time of day (just for flair)
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* 1. Header Section */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#94a3b8" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{getGreeting()}</Text>
                    <Text style={styles.headerSubtitle}>{weekRange}</Text>
                </View>
                {/* Week Toggle or Calendar Icon could go here */}
            </View>

            {/* 2. Summary Card */}
            <View style={styles.summarySection}>
                <View style={styles.summaryCard}>
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryLabel}>Total Shifts</Text>
                        <Text style={styles.summaryValue}>{totalShifts}</Text>
                    </View>
                    <View style={styles.summaryIcon}>
                        <Calendar size={32} color="#818cf8" />
                    </View>
                </View>
            </View>

            {/* 3. Shifts List */}
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
                    {weekData.map((day) => {
                        const hasShift = day.shifts.length > 0;

                        return (
                            <View key={day.date} style={styles.dayGroup}>

                                {/* Day Header */}
                                <View style={styles.dayHeader}>
                                    <Text style={[styles.dayName, !hasShift && styles.dayNameDim]}>
                                        {day.dayName}
                                    </Text>
                                    {/* Optional: Add date number here e.g. "22" */}
                                </View>

                                {/* Content */}
                                <View style={styles.shiftsContainer}>
                                    {hasShift ? (
                                        day.shifts.map((shift) => (
                                            <View key={shift.id} style={styles.shiftCard}>
                                                {/* Time Stripe */}
                                                <View style={styles.timeStripe} />

                                                <View style={styles.cardInner}>
                                                    <View style={styles.cardHeader}>
                                                        <Text style={styles.roleText}>{shift.roleName}</Text>
                                                        <View style={styles.timeBadge}>
                                                            <Clock size={12} color="#94a3b8" />
                                                            <Text style={styles.timeText}>{shift.startTime} - {shift.endTime}</Text>
                                                        </View>
                                                    </View>

                                                    {/* Visual flair: Icon based on time */}
                                                    <View style={styles.iconContainer}>
                                                        {parseInt(shift.startTime) >= 18 ? (
                                                            <Moon size={16} color="#64748b" />
                                                        ) : (
                                                            <Sun size={16} color="#64748b" />
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        ))
                                    ) : (
                                        // Empty State for the Day
                                        <View style={styles.noShiftRow}>
                                            <Text style={styles.noShiftText}>
                                                {day.isClosed ? 'Closed' : 'No shift scheduled'}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                            </View>
                        );
                    })}

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        marginBottom: 24
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
        marginRight: 16
    },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
    headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 2 },

    // Summary
    summarySection: { paddingHorizontal: 24, marginBottom: 32 },
    summaryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    summaryContent: {
        flex: 1,
        justifyContent: 'center',
    },
    summaryLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    summaryValue: { color: '#ffffff', fontSize: 36, fontWeight: '700' },
    summaryIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(129, 140, 248, 0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },

    // List
    listContent: { paddingHorizontal: 24 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Day Group
    dayGroup: { marginBottom: 24 },
    dayHeader: { marginBottom: 12 },
    dayName: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
    dayNameDim: { color: '#64748b' }, // Dimmed if no shift

    shiftsContainer: { gap: 12 },

    // Shift Card
    shiftCard: {
        flexDirection: 'row',
        backgroundColor: '#0f172a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
        overflow: 'hidden',
        minHeight: 72,
    },
    timeStripe: {
        width: 4,
        backgroundColor: '#4f46e5', // Brand Indigo
    },
    cardInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    cardHeader: { gap: 6 },
    roleText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },

    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeText: { color: '#94a3b8', fontSize: 14 },

    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#020617', // Darker inner bg
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1e293b'
    },

    // No Shift State
    noShiftRow: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(30, 41, 59, 0.5)', // Very subtle border
        backgroundColor: 'rgba(15, 23, 42, 0.3)', // Very subtle bg
    },
    noShiftText: {
        color: '#475569', // Slate-600 (Darker/Muted)
        fontSize: 14,
        fontStyle: 'italic'
    }
});