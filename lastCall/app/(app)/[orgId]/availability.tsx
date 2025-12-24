import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, X, Star } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DaySchedule, UpdateOrgAvailabilityRequest } from '@/types/api';
import { api } from '@/lib/api';




const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function OrgAvailability() {
    const router = useRouter();
    const { orgId } = useLocalSearchParams();
    const [saving, setSaving] = useState(false);

    // Initial State: Default to 9-5 M-F, Unavailable Sat-Sun
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const data = await api.getMyOrgAvailability(orgId as string);

                if (data.length > 0) {
                    const transformed = data.map(item => ({
                        dayOfWeek: item.dayOfWeek,
                        status: item.status,
                        startTime: item.startTime ? item.startTime.substring(11,16) : '09:00',
                        endTime: item.endTime ? item.endTime.substring(11,16) : '17:00'
                    }));

                    // Sort by the DAYS_OF_WEEK order
                    const sorted = transformed.sort((a, b) => {
                        return DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
                    });

                    setSchedule(sorted);
                } else {
                    setSchedule(
                        DAYS_OF_WEEK.map((day) => ({
                            dayOfWeek: day,
                            status: (day === 'Saturday' || day === 'Sunday') ? 'UNAVAILABLE' : 'AVAILABLE',
                            startTime: '09:00',
                            endTime: '17:00'
                        }))
                    )
                }
            } catch (error) {
                console.error('Failed to fetch availability:', error);
                setSchedule(
                    DAYS_OF_WEEK.map((day) => ({
                        dayOfWeek: day,
                        status: (day === 'Saturday' || day === 'Sunday') ? 'UNAVAILABLE' : 'AVAILABLE',
                        startTime: '09:00',
                        endTime: '17:00'
                    }))
                )
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [orgId])

    const updateDay = (index: number, updates: Partial<DaySchedule>) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], ...updates };
        setSchedule(newSchedule);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: UpdateOrgAvailabilityRequest = {
                availability: schedule.map(day => ({
                    dayOfWeek: day.dayOfWeek,
                    status: day.status,
                    startTime: day.status !== 'UNAVAILABLE' ? day.startTime : undefined,
                    endTime: day.status !== 'UNAVAILABLE' ? day.endTime : undefined
                }))
            };

            await api.updateMyOrgAvailability(orgId as string, payload);

            router.back();
        } catch (error) {
            console.error('Failed to save availability:', error);
            Alert.alert('Error', 'Failed to save availability. Please try again');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                    <Text style={{ color: '#94a3b8', marginTop: 16 }}>Loading availability...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#94a3b8" />
                </TouchableOpacity>
                <Text style={styles.title}>Organization Availability</Text>
                <Text style={styles.subtitle}>Set your hours for this organization.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {schedule.map((day, index) => (
                    <DayRow
                        key={day.dayOfWeek}
                        data={day}
                        onUpdate={(updates) => updateDay(index, updates)}
                    />
                ))}

                {/* Spacer for FAB or Bottom Button */}
                <View style={{ height: 80 }} />
            </ScrollView>

            {/* Floating Save Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ---------------------------------------------------------------------------
// Sub-Component: Individual Day Row
// ---------------------------------------------------------------------------
function DayRow({
    data,
    onUpdate
}: {
    data: DaySchedule,
    onUpdate: (u: Partial<DaySchedule>) => void
}) {
    const isOff = data.status === 'UNAVAILABLE';
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');

    // Convert time string (HH:MM) to Date object for picker
    const getDateFromTime = (timeString: string): Date => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        return date;
    };

    // Handle time change from picker
    const handleTimeChange = (event: any, selectedDate?: Date) => {
        // On Android, dismiss picker immediately
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }

        if (selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}`;

            if (pickerMode === 'start') {
                onUpdate({ startTime: timeString });
            } else {
                onUpdate({ endTime: timeString });
            }
        }

        // On iOS, keep picker open (inline display)
        if (Platform.OS === 'ios' && event.type === 'dismissed') {
            setShowPicker(false);
        }
    };

    const openStartTimePicker = () => {
        setPickerMode('start');
        setShowPicker(true);
    };

    const openEndTimePicker = () => {
        setPickerMode('end');
        setShowPicker(true);
    };

    return (
        <View style={[styles.card, isOff && styles.cardDimmed]}>

            {/* Top Row: Day Name + Status Toggles */}
            <View style={styles.cardHeader}>
                <Text style={[styles.dayName, isOff && styles.dayNameDimmed]}>
                    {data.dayOfWeek}
                </Text>

                <View style={styles.statusToggleContainer}>
                    {/* Unavailable Button */}
                    <TouchableOpacity
                        style={[styles.statusBtn, data.status === 'UNAVAILABLE' && styles.statusBtnActiveOff]}
                        onPress={() => onUpdate({ status: 'UNAVAILABLE' })}
                    >
                        <X size={14} color={data.status === 'UNAVAILABLE' ? '#ffffff' : '#64748b'} />
                    </TouchableOpacity>

                    {/* Available Button */}
                    <TouchableOpacity
                        style={[styles.statusBtn, data.status === 'AVAILABLE' && styles.statusBtnActiveAvail]}
                        onPress={() => onUpdate({ status: 'AVAILABLE' })}
                    >
                        <Check size={14} color={data.status === 'AVAILABLE' ? '#ffffff' : '#64748b'} />
                    </TouchableOpacity>

                    {/* Preferred Button */}
                    <TouchableOpacity
                        style={[styles.statusBtn, data.status === 'PREFERRED' && styles.statusBtnActivePref]}
                        onPress={() => onUpdate({ status: 'PREFERRED' })}
                    >
                        <Star size={14} color={data.status === 'PREFERRED' ? '#ffffff' : '#64748b'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Expandable Time Inputs (Only if NOT Unavailable) */}
            {!isOff && (
                <View style={styles.timeRow}>

                    {/* Start Time */}
                    <View style={styles.timeInputGroup}>
                        <Text style={styles.timeLabel}>Start</Text>
                        <TouchableOpacity style={styles.timeInput} onPress={openStartTimePicker}>
                            <Text style={styles.timeText}>{data.startTime}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.timeDivider} />

                    {/* End Time */}
                    <View style={styles.timeInputGroup}>
                        <Text style={styles.timeLabel}>End</Text>
                        <TouchableOpacity style={styles.timeInput} onPress={openEndTimePicker}>
                            <Text style={styles.timeText}>{data.endTime}</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            )}

            {/* Time Picker Modal (Android) or Inline (iOS) */}
            {showPicker && !isOff && (
                <DateTimePicker
                    value={getDateFromTime(pickerMode === 'start' ? data.startTime : data.endTime)}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        marginBottom: 24,
    },
    backButton: {
        marginBottom: 16,
        width: 40,
        height: 40,
        justifyContent: 'center',
        marginLeft: -8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
    },
    scrollContent: {
        paddingHorizontal: 24,
        gap: 12,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 32,
        backgroundColor: 'rgba(2, 6, 23, 0.95)', // Blur effect backing
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
    },
    saveButton: {
        backgroundColor: '#4f46e5',
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },

    // Card Styles
    card: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    cardDimmed: {
        opacity: 0.6,
        borderColor: 'transparent',
        backgroundColor: '#0f172a', // Keep dark, just opacity change
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dayName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    dayNameDimmed: {
        color: '#94a3b8',
    },

    // Status Toggles
    statusToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 8,
        padding: 2,
        gap: 2,
    },
    statusBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    statusBtnActiveOff: {
        backgroundColor: '#475569', // Slate-600
    },
    statusBtnActiveAvail: {
        backgroundColor: '#2eb88a', // Emerald
    },
    statusBtnActivePref: {
        backgroundColor: '#e5b454', // Amber
    },

    // Time Inputs
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
    },
    timeInputGroup: {
        flex: 1,
        gap: 6,
    },
    timeLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    timeInput: {
        backgroundColor: '#020617',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    timeText: {
        color: '#ffffff',
        fontSize: 16,
        fontVariant: ['tabular-nums'], // Monospace numbers for alignment
    },
    timeDivider: {
        width: 16,
        height: 1,
        backgroundColor: '#334155',
        marginHorizontal: 12,
        marginTop: 20, // Align with input box roughly
    },
});