import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    Modal,
    TextInput,
    Alert,
    Share
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
    ArrowLeft,
    X,
    Link as LinkIcon,
    Copy,
    Check
} from 'lucide-react-native';
import { api } from '@/lib/api';
import { Employee, OrganizationDetail } from '@/types/api';
import * as Clipboard from 'expo-clipboard';

export default function OrganizationDashboard() {
    const router = useRouter();
    const { orgId } = useLocalSearchParams();

    const [org, setOrg] = useState<OrganizationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [employee, setEmployee] = useState<Employee | null>(null);

    // --- INVITE MODAL STATE ---
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [expirationDays, setExpirationDays] = useState(7); // Default 7 days
    const [copied, setCopied] = useState(false);

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

    // --- INVITE LOGIC ---
    const handleGenerateInvite = async () => {
        setInviteLoading(true);
        try {
            const response = await api.createInviteLink(orgId as string, expirationDays);
            setGeneratedLink(response.inviteUrl);
        } catch (error) {
            Alert.alert("Error", "Failed to generate invite link.");
            console.error(error);
        } finally {
            setInviteLoading(false);
        }
    };

    const handleCopyLink = async () => {
        if (!generatedLink) return;

        try {
            await Clipboard.setStringAsync(generatedLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
            Alert.alert("Error", "Failed to copy link to clipboard");
        }
    };

    const handleShareLink = async () => {
        if (!generatedLink) return;
        try {
            await Share.share({
                message: `Join ${org?.name} on LastCall! Use this link: ${generatedLink}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const resetInviteModal = () => {
        setIsInviteModalOpen(false);
        setGeneratedLink(null);
        setExpirationDays(7);
        setCopied(false);
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

    const pendingCount = org.employees.filter(emp => emp.status === 'PENDING').length;

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
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{employee.role}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Action Grid */}
                <Text style={styles.sectionTitle}>Management</Text>
                <View style={styles.grid}>

                    {/* Schedules Card */}
                    {['OWNER', 'ADMIN'].includes(employee.role) && (
                        <DashboardCard
                            title="Schedules"
                            subtitle={`${org.schedules.length} Active`}
                            icon={CalendarDays}
                            color="#818cf8" // Indigo-400
                            onPress={() => {
                                router.push(`/(app)/${orgId}/schedulesList`);
                            }}
                        />
                    )}

                    {!['OWNER', 'ADMIN'].includes(employee.role) && (
                        <DashboardCard
                            title="Schedule"
                            subtitle={"Your weekly schedule"}
                            icon={CalendarDays}
                            color="#818cf8" // Indigo-400
                            onPress={() => {
                                router.push(`/(app)/${orgId}/employeeSchedule`);
                            }}
                        />
                    )}

                    {/* Employees Card */}
                    <DashboardCard
                        title="Team"
                        subtitle={`${org.employees.length} Members`}
                        icon={Users}
                        color="#34d399" // Emerald-400
                        badge={['OWNER', 'ADMIN'].includes(employee?.role) ? pendingCount : undefined}
                        onPress={() => {
                            router.push(`/(app)/${orgId}/employees`);
                        }}
                    />

                    {/* Roles Card (Admin/Owner Only) */}
                    {['OWNER', 'ADMIN'].includes(employee.role) && (
                        <DashboardCard
                            title="Job Roles"
                            subtitle="Manage positions"
                            icon={Briefcase}
                            color="#e5b454" // Amber
                            onPress={() => {
                                router.push(`/(app)/${orgId}/jobRoles`);
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
                            router.push(`/(app)/${orgId}/availability`)
                        }}
                    />

                </View>

                {/* Quick Actions */}
                {['OWNER', 'ADMIN'].includes(employee.role) && (
                    <>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <TouchableOpacity 
                            style={styles.actionRow} 
                            activeOpacity={0.7}
                            onPress={() => setIsInviteModalOpen(true)}
                        >
                            <View style={styles.actionRowContent}>
                                <Text style={styles.actionRowTitle}>Invite New Employees</Text>
                                <Text style={styles.actionRowSubtitle}>Create a link to share with your team</Text>
                            </View>
                            <ChevronRight size={20} color="#475569" />
                        </TouchableOpacity>
                    </>
                )}

            </ScrollView>

            {/* --- INVITE MODAL --- */}
            <Modal
                visible={isInviteModalOpen}
                animationType="fade"
                transparent={true}
                onRequestClose={resetInviteModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderIcon}>
                                <LinkIcon size={20} color="#4f46e5" />
                            </View>
                            <Text style={styles.modalTitle}>Invite Employees</Text>
                            <TouchableOpacity onPress={resetInviteModal} style={styles.closeButton}>
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            {!generatedLink ? (
                                // --- STEP 1: CONFIGURATION ---
                                <>
                                    <Text style={styles.modalText}>
                                        Create a temporary link to allow new staff members to join {org.name}.
                                    </Text>
                                    
                                    <Text style={styles.inputLabel}>Link Expiration</Text>
                                    <View style={styles.expirationOptions}>
                                        {[1, 7, 30].map((days) => (
                                            <TouchableOpacity 
                                                key={days}
                                                style={[
                                                    styles.expirationOption, 
                                                    expirationDays === days && styles.expirationOptionActive
                                                ]}
                                                onPress={() => setExpirationDays(days)}
                                            >
                                                <Text style={[
                                                    styles.expirationText,
                                                    expirationDays === days && styles.expirationTextActive
                                                ]}>
                                                    {days} Days
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <TouchableOpacity 
                                        style={styles.generateButton}
                                        onPress={handleGenerateInvite}
                                        disabled={inviteLoading}
                                    >
                                        {inviteLoading ? (
                                            <ActivityIndicator color="#ffffff" />
                                        ) : (
                                            <Text style={styles.buttonText}>Generate Link</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            ) : (
                                // --- STEP 2: RESULT ---
                                <>
                                    <Text style={styles.modalText}>
                                        Share this link with your employees. They will be added to the pending list for approval.
                                    </Text>

                                    <View style={styles.linkContainer}>
                                        <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
                                            {generatedLink}
                                        </Text>
                                    </View>

                                    <View style={styles.resultActions}>
                                        <TouchableOpacity 
                                            style={[styles.actionButton, styles.copyButton]} 
                                            onPress={handleCopyLink}
                                        >
                                            {copied ? <Check size={18} color="#ffffff" /> : <Copy size={18} color="#ffffff" />}
                                            <Text style={styles.buttonText}>{copied ? "Copied!" : "Copy"}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={[styles.actionButton, styles.shareButton]} 
                                            onPress={handleShareLink}
                                        >
                                            <Text style={styles.buttonText}>Share</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity 
                                        style={styles.doneButton}
                                        onPress={resetInviteModal}
                                    >
                                        <Text style={styles.doneButtonText}>Done</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Helper Component for Grid Items (unchanged)
function DashboardCard({
    title,
    subtitle,
    icon: Icon,
    color,
    badge,
    onPress
}: {
    title: string,
    subtitle: string,
    icon: any,
    color: string,
    badge?: number,
    onPress: () => void
}) {
    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: `${color}15` }]}>
                    <Icon size={24} color={color} />
                </View>
                {badge !== undefined && badge > 0 && (
                    <View style={styles.cardBadge}>
                        <Text style={styles.cardBadgeText}>{badge > 9 ? '9+' : badge}</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    // ... (All previous styles remain exactly the same)
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
        position: 'relative',
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
    cardBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        borderWidth: 2,
        borderColor: '#0f172a',
    },
    cardBadgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
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

    // --- MODAL STYLES (NEW) ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(2, 6, 23, 0.85)', // Darker overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#0f172a', // Surface color
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#1e293b',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    modalHeaderIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    modalContent: {
        padding: 24,
    },
    modalText: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 22,
        marginBottom: 24,
    },
    
    // Inputs
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#cbd5e1',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    expirationOptions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    expirationOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#020617', // Darker than modal
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
    },
    expirationOptionActive: {
        backgroundColor: '#4f46e5',
        borderColor: '#4f46e5',
    },
    expirationText: {
        color: '#94a3b8',
        fontWeight: '600',
        fontSize: 14,
    },
    expirationTextActive: {
        color: '#ffffff',
    },

    // Buttons
    generateButton: {
        backgroundColor: '#4f46e5',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    
    // Result View
    linkContainer: {
        backgroundColor: '#020617',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 20,
    },
    linkText: {
        color: '#818cf8',
        fontSize: 14,
        fontFamily: 'monospace', // Or just standard font
    },
    resultActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    copyButton: {
        backgroundColor: '#334155',
    },
    shareButton: {
        backgroundColor: '#4f46e5',
    },
    doneButton: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#94a3b8',
        fontWeight: '600',
        fontSize: 16,
    },
});