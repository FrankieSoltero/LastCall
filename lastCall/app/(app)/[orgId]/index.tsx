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
    Check,
    CalendarClock,
    Settings
} from 'lucide-react-native';
import { api } from '@/lib/api';
import { useOrganization, useEmployee } from '@/lib/queries';
import { Employee, OrganizationDetail } from '@/types/api';
import * as Clipboard from 'expo-clipboard';

export default function OrganizationDashboard() {
    const router = useRouter();
    const { orgId } = useLocalSearchParams();

    // React Query hooks - automatic caching
    const { data: org = null, isLoading: orgLoading, refetch: refetchOrg, isRefetching: orgRefetching } = useOrganization(orgId as string);
    const { data: employee = null, isLoading: employeeLoading, refetch: refetchEmployee, isRefetching: employeeRefetching } = useEmployee(orgId as string);

    const loading = orgLoading || employeeLoading;
    const refreshing = orgRefetching || employeeRefetching;

    // --- INVITE MODAL STATE ---
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [expirationDays, setExpirationDays] = useState(7);
    const [copied, setCopied] = useState(false);

    const onRefresh = async () => {
        await Promise.all([refetchOrg(), refetchEmployee()]);
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

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    if (!org || !employee) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>{!org ? "Organization not found." : "You are not a member."}</Text>
                    <TouchableOpacity onPress={() => router.replace('/(app)/forkPage')} style={styles.backButtonSimple}>
                        <Text style={styles.backButtonText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (employee.status === 'PENDING' || employee.status === 'DENIED') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.title}>{employee.status === 'PENDING' ? "Awaiting Approval" : "Access Denied"}</Text>
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

                {/* Management Grid */}
                <Text style={styles.sectionTitle}>Management</Text>
                <View style={styles.grid}>
                    {['OWNER', 'ADMIN'].includes(employee.role) && (
                        <DashboardCard
                            title="Schedules"
                            subtitle={`${org.schedules.length} Active`}
                            icon={CalendarDays}
                            color="#818cf8"
                            onPress={() => router.push(`/(app)/${orgId}/schedulesList`)}
                        />
                    )}
                    {!['OWNER', 'ADMIN'].includes(employee.role) && (
                        <DashboardCard
                            title="Schedule"
                            subtitle={"Your weekly schedule"}
                            icon={CalendarDays}
                            color="#818cf8"
                            onPress={() => router.push(`/(app)/${orgId}/employeeSchedule`)}
                        />
                    )}
                    <DashboardCard
                        title="Team"
                        subtitle={`${org.employees.length} Members`}
                        icon={Users}
                        color="#34d399"
                        badge={['OWNER', 'ADMIN'].includes(employee?.role) ? pendingCount : undefined}
                        onPress={() => router.push(`/(app)/${orgId}/employees`)}
                    />
                    {['OWNER', 'ADMIN'].includes(employee.role) && (
                        <DashboardCard
                            title="Job Roles"
                            subtitle="Manage positions"
                            icon={Briefcase}
                            color="#e5b454"
                            onPress={() => router.push(`/(app)/${orgId}/jobRoles`)}
                        />
                    )}
                    <DashboardCard
                        title="Availability"
                        subtitle="Set your hours"
                        icon={Clock}
                        color="#f472b6"
                        onPress={() => router.push(`/(app)/${orgId}/availability`)}
                    />
                    {!['OWNER', 'ADMIN'].includes(employee.role) && (
                        <DashboardCard
                            title="Shifts"
                            subtitle={"Your shifts for this week"}
                            icon={CalendarClock}
                            color="#e5b454"
                            onPress={() => router.push(`/(app)/${orgId}/personalSchedule`)}
                        />
                    )}
                </View>

                {/* Quick Actions (Admin Only) */}
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

                {/* Account Settings (For Everyone) */}
                {/* Added 'marginTop: 24' to separate if coming after Quick Actions */}
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Account</Text>
                
                {/* SETTINGS BUTTON - Identical Style to Invite Button */}
                <TouchableOpacity
                    style={styles.actionRow}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/(app)/${orgId}/organizationSettings`)}
                >
                    <View style={styles.actionRowContent}>
                        <Text style={styles.actionRowTitle}>Settings</Text>
                        <Text style={styles.actionRowSubtitle}>Preferences, notifications, and security</Text>
                    </View>
                    <ChevronRight size={20} color="#475569" />
                </TouchableOpacity>
            </ScrollView>

            {/* Invite Modal */}
            <Modal
                visible={isInviteModalOpen}
                animationType="fade"
                transparent={true}
                onRequestClose={resetInviteModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
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

// Helper Component for Grid Items
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
    container: {
        flex: 1,
        backgroundColor: '#020617',
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
    card: {
        width: '47%',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#0f172a',
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
        backgroundColor: '#020617',
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
        fontFamily: 'monospace',
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