import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    ActivityIndicator,
    Alert,
    ScrollView,
    Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    User,
    Check,
    X,
    Shield,
    MoreVertical,
    Mail,
    Trash2,
    Briefcase,
} from 'lucide-react-native';
import { EmployeeRole, EmployeeStatus, Role } from '@/types/api';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// --- Types ---


type EmployeeDisplay = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: EmployeeStatus;
    systemRole: EmployeeRole; // The permission level (Admin vs Employee)
    roles: Role[]; // The job positions (Bartender, etc.)
};

export default function EmployeeManagement() {
    const router = useRouter();
    const { orgId } = useLocalSearchParams();
    // State
    const [employees, setEmployees] = useState<EmployeeDisplay[]>([]);
    const [currentEmployeeId, setCurrentEmployeeId] = useState("");
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<EmployeeRole>('EMPLOYEE');
    const isManager = ['OWNER', 'ADMIN'].includes(currentUserRole);

    // Modal State
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDisplay | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]); // Track job role selections
    const [hasChanges, setHasChanges] = useState(false);

    // --- 1. Load Data ---
    useEffect(() => {
        const loadUserRole = async () => {
            try {
                const myEmployee = await api.getEmployee(orgId as string);
                console.log(myEmployee.role);
                setCurrentUserRole(myEmployee.role);
                setCurrentEmployeeId(myEmployee.id);
            } catch (error) {
                console.error('Failed to get user role:', error);
            }
        };
        loadUserRole();
        fetchData();
    }, [orgId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [employeeData, rolesData] = await Promise.all([
                api.getEmployees(orgId as string),
                api.getRoles(orgId as string)
            ]);

            const transformedEmployees: EmployeeDisplay[] = employeeData.map(emp => ({
                id: emp.id,
                firstName: emp.user.firstName,
                lastName: emp.user.lastName,
                email: emp.user.email,
                status: emp.status,
                systemRole: emp.role,
                roles: (emp as any).roleAssignments?.map((ra: any) => ra.role) || []
            }));

            setEmployees(transformedEmployees);
            setAvailableRoles(rolesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            Alert.alert('Error', 'Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    // --- 2. Action Handlers (Admin Only) ---

    const handleApprove = async (empId: string) => {
        try {
            await api.updateEmployee(orgId as string, empId, { status: 'APPROVED' });

            setEmployees(prev => prev.map(e => e.id === empId ? { ...e, status: 'APPROVED' as EmployeeStatus } : e));
        } catch (error) {
            console.error('Failed to approve employee:', error);
            Alert.alert('Error', 'Failed to approve employee');
        }
    };

    const handleDeny = async (empId: string) => {
        Alert.alert("Deny Request", "Deny access to this organization?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Deny",
                style: "destructive",
                onPress: async () => {
                    try {
                        // Just delete them outright instead of setting status to DENIED
                        await api.removeEmployee(orgId as string, empId);

                        // Remove from list
                        setEmployees(prev => prev.filter(e => e.id !== empId));
                    } catch (error) {
                        console.error('Failed to deny employee:', error);
                        Alert.alert('Error', 'Failed to deny request');
                    }
                }
            }
        ]);
    };

    const handleRemoveEmployee = async () => {
        if (!selectedEmployee) return;
        Alert.alert("Remove Employee", `Remove ${selectedEmployee.firstName}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.removeEmployee(orgId as string, selectedEmployee.id);

                        setIsModalOpen(false);
                        setEmployees(prev => prev.filter(e => e.id !== selectedEmployee.id));
                    } catch (error) {
                        console.error('Failed to remove employee:', error);
                        Alert.alert('Error', 'Failed to remove employee');
                    }
                }
            }
        ]);
    };

    const toggleJobRole = (roleId: string) => {
        setSelectedRoleIds(prev => {
            const hasRole = prev.includes(roleId);
            const newRoles = hasRole
                ? prev.filter(id => id !== roleId)
                : [...prev, roleId];

            // Check if roles changed from original
            const originalRoleIds = selectedEmployee?.roles.map(r => r.id) || [];
            const changed = JSON.stringify(newRoles.sort()) !== JSON.stringify(originalRoleIds.sort());
            setHasChanges(changed);

            return newRoles;
        });
    };

    const saveRoleChanges = async () => {
        if (!selectedEmployee || !hasChanges) return;

        try {
            const originalRoleIds = selectedEmployee.roles.map(r => r.id);
            const rolesToAdd = selectedRoleIds.filter(id => !originalRoleIds.includes(id));
            const rolesToRemove = originalRoleIds.filter(id => !selectedRoleIds.includes(id));

            // Execute all role changes in parallel
            const promises = [
                ...rolesToAdd.map(roleId =>
                    api.assignEmployeeRole(orgId as string, selectedEmployee.id, roleId)
                ),
                ...rolesToRemove.map(roleId =>
                    api.removeEmployeeRole(orgId as string, selectedEmployee.id, roleId)
                )
            ];

            await Promise.all(promises);

            // Update local state with new roles
            const newRoles = availableRoles.filter(r => selectedRoleIds.includes(r.id));
            const updated = { ...selectedEmployee, roles: newRoles };
            setSelectedEmployee(updated);
            setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
            setHasChanges(false);

            Alert.alert('Success', 'Job positions updated successfully');
        } catch (error) {
            console.error('Failed to save job role changes:', error);
            Alert.alert('Error', 'Failed to update job positions');
        }
    };

    const openEmployeeModal = (employee: EmployeeDisplay) => {
        setSelectedEmployee(employee);
        setSelectedRoleIds(employee.roles.map(r => r.id));
        setHasChanges(false);
        setIsModalOpen(true);
    };

    const closeEmployeeModal = () => {
        if (hasChanges) {
            Alert.alert(
                'Unsaved Changes',
                'You have unsaved changes. Are you sure you want to close?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                            setIsModalOpen(false);
                            setHasChanges(false);
                            setSelectedRoleIds([]);
                        }
                    }
                ]
            );
        } else {
            setIsModalOpen(false);
            setSelectedRoleIds([]);
        }
    };

    const toggleAdminStatus = async () => {
        if (!selectedEmployee) return;

        // Toggle between ADMIN and EMPLOYEE
        const newRole: EmployeeRole = selectedEmployee.systemRole === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN';

        try {
            await api.updateEmployee(orgId as string, selectedEmployee.id, { role: newRole });

            // Update local state
            const updated = { ...selectedEmployee, systemRole: newRole };
            setSelectedEmployee(updated);
            setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
        } catch (error) {
            console.error('Failed to toggle admin status:', error);
            Alert.alert('Error', 'Failed to update admin status');
        }
    };

    // --- 3. Render Items ---

    const renderPendingItem = ({ item }: { item: EmployeeDisplay }) => (
        <View style={styles.pendingCard}>
            <View style={styles.pendingInfo}>
                <Text style={styles.pendingName}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.pendingEmail}>{item.email}</Text>
            </View>
            <View style={styles.pendingActions}>
                <TouchableOpacity style={styles.denyBtn} onPress={() => handleDeny(item.id)}>
                    <X size={20} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                    <Check size={20} color="#ffffff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEmployeeItem = ({ item }: { item: EmployeeDisplay }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => openEmployeeModal(item)}
        >
            <View style={styles.avatar}>
                <User size={20} color="#94a3b8" />
            </View>

            <View style={styles.cardContent}>
                <View style={styles.nameRow}>
                    <Text style={styles.cardTitle}>{item.firstName} {item.lastName}</Text>
                    {/* Show Shield icon if they are an Admin */}
                    {item.systemRole !== 'EMPLOYEE' && (
                        <Shield size={14} color="#e5b454" style={{ marginLeft: 6 }} />
                    )}
                </View>
                <Text style={styles.cardSubtitle}>{item.email}</Text>

                {/* Job Role Chips */}
                {item.roles.length > 0 && (
                    <View style={styles.chipRow}>
                        {item.roles.map(r => (
                            <View key={r.id} style={styles.roleChip}>
                                <Text style={styles.roleChipText}>{r.name}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Only show "Edit" dots if user is a Manager */}
            {isManager && <MoreVertical size={20} color="#475569" />}
        </TouchableOpacity>
    );

    const pendingList = employees.filter(e => e.status === 'PENDING');
    const approvedList = employees.filter(e => e.status === 'APPROVED');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#94a3b8" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Team Members</Text>
                    <Text style={styles.subtitle}>{approvedList.length} Active</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color="#4f46e5" />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* PENDING: Only Visible to Admins */}
                    {isManager && pendingList.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.badgeWarning}>
                                    <Text style={styles.badgeWarningText}>{pendingList.length}</Text>
                                </View>
                                <Text style={styles.sectionTitle}>Pending Requests</Text>
                            </View>
                            {pendingList.map(item => (
                                <View key={item.id} style={{ marginBottom: 12 }}>
                                    {renderPendingItem({ item })}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* APPROVED LIST: Visible to Everyone */}
                    <View style={styles.section}>
                        {isManager && <Text style={styles.sectionEmployeeTitle}>All Employees</Text>}
                        {approvedList.map(item => (
                            <View key={item.id} style={{ marginBottom: 12 }}>
                                {renderEmployeeItem({ item })}
                            </View>
                        ))}
                        {approvedList.length === 0 && (
                            <Text style={styles.emptyText}>No active employees found.</Text>
                        )}
                    </View>

                </ScrollView>
            )}

            {/* --- MODAL (Behavior changes based on permission) --- */}
            <Modal
                visible={isModalOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeEmployeeModal}
            >
                <View style={styles.modalContainer}>
                    {selectedEmployee && (
                        <>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {isManager ? 'Edit Employee' : 'Contact Info'}
                                </Text>
                                <TouchableOpacity onPress={closeEmployeeModal}>
                                    <Text style={styles.closeText}>
                                        {isManager && hasChanges ? 'Cancel' : 'Done'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView contentContainerStyle={styles.modalContent}>

                                {/* 1. Profile Card (Visible to All) */}
                                <View style={styles.profileCard}>
                                    <View style={styles.profileAvatar}>
                                        <Text style={styles.profileInitials}>
                                            {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                                        </Text>
                                    </View>
                                    <Text style={styles.profileName}>
                                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                                    </Text>
                                    <View style={styles.detailRow}>
                                        <Mail size={16} color="#94a3b8" />
                                        <Text style={styles.detailText}>{selectedEmployee.email}</Text>
                                    </View>
                                    {/* Show System Role Label */}
                                    <View style={[styles.detailRow, { marginTop: 4 }]}>
                                        <Shield size={16} color={['OWNER', 'ADMIN'].includes(selectedEmployee.systemRole) ? '#e5b454' : '#64748b'} />
                                        <Text style={styles.detailText}>
                                            {['OWNER', 'ADMIN'].includes(selectedEmployee.systemRole) ? 'Administrator' : 'Employee'}
                                        </Text>
                                    </View>
                                </View>

                                {/* 2. Admin Controls (Only if User is Manager) */}
                                {isManager ? (
                                    <>
                                        <View style={styles.divider} />

                                        {/* Permission Level */}
                                        {selectedEmployee.systemRole !== 'OWNER' && selectedEmployee.id !== currentEmployeeId && (
                                            <>
                                                <Text style={styles.modalSectionTitle}>Access Level</Text>
                                                <View style={styles.adminToggleCard}>
                                                    <View>
                                                        <Text style={styles.adminToggleTitle}>Administrator Access</Text>
                                                        <Text style={styles.adminToggleDesc}>
                                                            Can manage schedules, shifts, and employees.
                                                        </Text>
                                                    </View>
                                                    <Switch
                                                        value={['OWNER', 'ADMIN'].includes(selectedEmployee.systemRole)}
                                                        onValueChange={toggleAdminStatus}
                                                        trackColor={{ false: '#1e293b', true: '#4f46e5' }}
                                                        thumbColor="#ffffff"
                                                    />
                                                </View>
                                            </>)}

                                        {/* Job Assignments */}
                                        <Text style={[styles.modalSectionTitle, { marginTop: 24 }]}>
                                            Job Positions
                                        </Text>
                                        <View style={styles.rolesGrid}>
                                            {availableRoles.map(role => {
                                                const isActive = selectedRoleIds.includes(role.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={role.id}
                                                        style={[styles.roleToggle, isActive && styles.roleToggleActive]}
                                                        onPress={() => toggleJobRole(role.id)}
                                                    >
                                                        <Briefcase size={16} color={isActive ? '#ffffff' : '#94a3b8'} />
                                                        <Text style={[styles.roleToggleText, isActive && styles.roleToggleTextActive]}>
                                                            {role.name}
                                                        </Text>
                                                        {isActive && <Check size={16} color="#ffffff" style={{ marginLeft: 'auto' }} />}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>

                                        {/* Save Button - Only show if there are changes */}
                                        {hasChanges && (
                                            <TouchableOpacity
                                                style={styles.saveButton}
                                                onPress={saveRoleChanges}
                                            >
                                                <Check size={20} color="#ffffff" />
                                                <Text style={styles.saveButtonText}>Save Changes</Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Danger Zone */}
                                        {selectedEmployee.id !== currentEmployeeId && (<TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={handleRemoveEmployee}
                                        >
                                            <Trash2 size={20} color="#ef4444" />
                                            <Text style={styles.removeButtonText}>Remove from Organization</Text>
                                        </TouchableOpacity>)}
                                    </>
                                ) : (
                                    // Read-Only View for regular employees
                                    <View style={styles.readOnlyRoles}>
                                        <Text style={styles.modalSectionTitle}>Assigned Roles</Text>
                                        <View style={styles.chipRow}>
                                            {selectedEmployee.roles.length > 0 ? (
                                                selectedEmployee.roles.map(r => (
                                                    <View key={r.id} style={styles.roleChipLarge}>
                                                        <Text style={styles.roleChipTextLarge}>{r.name}</Text>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={{ color: '#64748b' }}>No active roles assigned.</Text>
                                            )}
                                        </View>
                                    </View>
                                )}

                            </ScrollView>
                        </>
                    )}
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
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },

    // Sections
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionEmployeeTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10
    },
    badgeWarning: {
        backgroundColor: '#e5b454',
        borderRadius: 100,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeWarningText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#020617',
    },
    emptyText: {
        color: '#64748b',
        fontStyle: 'italic',
    },

    // Cards
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 6,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    roleChip: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    roleChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#818cf8',
    },

    // Pending Cards
    pendingCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(229, 180, 84, 0.05)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(229, 180, 84, 0.2)',
    },
    pendingInfo: { flex: 1 },
    pendingName: { fontSize: 16, fontWeight: '600', color: '#e5b454' },
    pendingEmail: { fontSize: 13, color: '#94a3b8' },
    pendingActions: { flexDirection: 'row', gap: 8 },
    approveBtn: { width: 40, height: 40, backgroundColor: '#2eb88a', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    denyBtn: { width: 40, height: 40, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

    // --- Modal Styles ---
    modalContainer: { flex: 1, backgroundColor: '#020617' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
    closeText: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
    modalContent: { padding: 24 },

    // Profile
    profileCard: { alignItems: 'center', marginBottom: 24 },
    profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
    profileInitials: { fontSize: 32, fontWeight: '700', color: '#cbd5e1' },
    profileName: { fontSize: 24, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    detailText: { color: '#94a3b8', fontSize: 16 },

    divider: { height: 1, backgroundColor: '#1e293b', marginBottom: 24 },
    modalSectionTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 16, textTransform: 'uppercase' },

    // Admin Toggle
    adminToggleCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    adminToggleTitle: { fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 4 },
    adminToggleDesc: { fontSize: 13, color: '#94a3b8', maxWidth: '80%' },

    // Role Toggles
    rolesGrid: { gap: 8, marginBottom: 40 },
    roleToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', gap: 12 },
    roleToggleActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
    roleToggleText: { fontSize: 16, color: '#94a3b8', fontWeight: '500' },
    roleToggleTextActive: { color: '#ffffff', fontWeight: '600' },

    // Read Only
    readOnlyRoles: { marginTop: 8 },
    roleChipLarge: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
    roleChipTextLarge: { color: '#94a3b8', fontSize: 14 },

    // Save Button
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4f46e5',
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginBottom: 24,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },

    removeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 12, gap: 8 },
    removeButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});