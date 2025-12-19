import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Building2,
    CalendarDays,
    Users,
    Briefcase,
    ChevronRight,
    Clock,
    ArrowLeft
} from 'lucide-react-native';
import { api } from '@/lib/api';
import { Employee, OrganizationDetail } from '@/types/api';


export default function OrganizationDashboard() {
    const router = useRouter();
    const { orgId } = useLocalSearchParams();

    const [org, setOrg] = useState<OrganizationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [employee, setEmployee] = useState<Employee | null>(null);

    // Fetch both org and employee data together
    const fetchAllData = async () => {
        try {
            console.log('Fetching organization and employee data for:', orgId);

            const [orgData, employeeData] = await Promise.all([
                api.getOrganization(orgId as string),
                api.getEmployee(orgId as string)
            ]);

            setOrg(orgData);
            setEmployee(employeeData);
        } catch (error: any) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [orgId]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAllData();
    };

    // Loading state
    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    // Error: Organization not found
    if (!org) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>Organization not found.</Text>
                    <TouchableOpacity onPress={() => router.replace('/(app)/forkPage')} style={styles.backButtonSimple}>
                        <Text style={styles.backButtonText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Error: Not a member
    if (!employee) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>You are not a member of this organization.</Text>
                    <TouchableOpacity onPress={() => router.replace('/(app)/forkPage')} style={styles.backButtonSimple}>
                        <Text style={styles.backButtonText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Status: Pending approval
    if (employee.status === 'PENDING') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#f59e0b" style={{ marginBottom: 16 }} />
                    <Text style={styles.title}>Awaiting Approval</Text>
                    <Text style={styles.pendingSubtitle}>
                        Your request to join {org.name} is pending admin approval.
                    </Text>
                    <TouchableOpacity onPress={() => router.replace('/(app)/forkPage')} style={styles.backButtonSimple}>
                        <Text style={styles.backButtonText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Status: Denied
    if (employee.status === 'DENIED') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>Access Denied</Text>
                    <Text style={styles.pendingSubtitle}>
                        Your request to join {org.name} was denied.
                    </Text>
                    <TouchableOpacity onPress={() => router.replace('/(app)/forkPage')} style={styles.backButtonSimple}>
                        <Text style={styles.backButtonText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // If status is APPROVED, show the dashboard below

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />
                }
            >

                {/* Header Navigation */}
                <TouchableOpacity
                    style={styles.backLink}
                    onPress={() => router.replace('/(app)/forkPage')}
                >
                    <ArrowLeft size={20} color="#94a3b8" />
                    <Text style={styles.backLinkText}>Switch Workspace</Text>
                </TouchableOpacity>

                {/* Org Header */}
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <View style={styles.iconBox}>
                            <Building2 size={24} color="#ffffff" />
                        </View>
                        <View style={styles.titleTextContainer}>
                            <Text style={styles.title}>{org.name}</Text>
                            {org.description && (
                                <Text style={styles.subtitle}>{org.description}</Text>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Action Grid */}
                <Text style={styles.sectionTitle}>Management</Text>
                <View style={styles.grid}>

                    {/* Schedules Card */}
                    <DashboardCard
                        title="Schedules"
                        subtitle={`${org.schedules.length} Active`}
                        icon={CalendarDays}
                        color="#818cf8" // Indigo-400
                        onPress={() => {
                            // TODO: Navigate to schedules
                            // router.push(`/(app)/${orgId}/schedules`);
                            console.log("Navigating to schedules...");
                        }}
                    />

                    {/* Employees Card */}
                    <DashboardCard
                        title="Team"
                        subtitle={`${org.employees.length} Members`}
                        icon={Users}
                        color="#34d399" // Emerald-400
                        onPress={() => {
                            // TODO: Navigate to employees
                            // router.push(`/(app)/${orgId}/employees`);
                            console.log("Navigating to employees...");
                        }}
                    />

                    {/* Roles Card (Admin/Owner Only) */}
                    {['OWNER', 'ADMIN'].includes(employee?.role) && (
                        <DashboardCard
                            title="Job Roles"
                            subtitle="Manage positions"
                            icon={Briefcase}
                            color="#e5b454" // Amber
                            onPress={() => {
                                // TODO: Navigate to roles
                                // router.push(`/(app)/${orgId}/roles`);
                                console.log("Navigating to roles...");
                            }}
                        />
                    )}

                    {/* Availability (Everyone) */}
                    <DashboardCard
                        title="Availability"
                        subtitle="Set your hours"
                        icon={Clock}
                        color="#f472b6" // Pink-400
                        onPress={() => {
                            // TODO: Navigate to availability
                            // router.push(`/(app)/${orgId}/availability`);
                            console.log("Navigating to availability...");
                        }}
                    />

                </View>

                {/* Quick Actions / Recent (Placeholder) */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
                    <View style={styles.actionRowContent}>
                        <Text style={styles.actionRowTitle}>Invite New Employees</Text>
                        <Text style={styles.actionRowSubtitle}>Create a link to share with your team</Text>
                    </View>
                    <ChevronRight size={20} color="#475569" />
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

// Helper Component for Grid Items
function DashboardCard({
    title,
    subtitle,
    icon: Icon,
    color,
    onPress
}: {
    title: string,
    subtitle: string,
    icon: any,
    color: string,
    onPress: () => void
}) {
    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: `${color}15` }]}>
                    <Icon size={24} color={color} />
                </View>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    // Layout
    container: {
        flex: 1,
        backgroundColor: '#020617', // App Background
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Navigation
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 8,
    },
    backLinkText: {
        color: '#94a3b8',
        fontSize: 16,
        fontWeight: '500',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        flex: 1,
        gap: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    titleTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        lineHeight: 32,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 2,
    },
    pendingSubtitle: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
        paddingHorizontal: 32,
        lineHeight: 24,
    },
    badge: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#334155',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#cbd5e1',
    },

    divider: {
        height: 1,
        backgroundColor: '#1e293b',
        marginBottom: 32,
    },

    // Grid
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 32,
    },

    // Cards
    card: {
        width: '47%', // roughly half width minus gap
        backgroundColor: '#0f172a',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1e293b',
        minHeight: 140,
        justifyContent: 'space-between',
    },
    cardHeader: {
        alignItems: 'flex-start',
    },
    cardIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        gap: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#64748b',
    },

    // Action Rows
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    actionRowContent: {
        flex: 1,
    },
    actionRowTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    actionRowSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
    },

    // Utilities
    errorText: {
        color: '#ef4444',
        fontSize: 16,
        marginBottom: 16,
    },
    backButtonSimple: {
        padding: 12,
    },
    backButtonText: {
        color: '#4f46e5',
        fontWeight: '600',
    },
});