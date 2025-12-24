import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    Building2,
    ChevronLeft,
    Trash2,
    Link as LinkIcon,
    Users,
    ChevronRight
} from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '@/lib/api';
import type { OrganizationDetail } from '@/types/api';

export default function OrganizationSettingsPage() {
    const router = useRouter();
    const { orgId } = useLocalSearchParams<{ orgId: string }>();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [organization, setOrganization] = useState<OrganizationDetail | null>(null);

    // Edit Organization Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [orgDescription, setOrgDescription] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        loadOrganization();
    }, []);

    const loadOrganization = async () => {
        try {
            const org = await api.getOrganization(orgId);
            setOrganization(org);
        } catch (error) {
            console.error('Failed to load organization:', error);
            Alert.alert('Error', 'Failed to load organization details');
        } finally {
            setLoading(false);
        }
    };

    const handleEditOrganization = () => {
        setOrgName(organization?.name || '');
        setOrgDescription(organization?.description || '');
        setIsEditModalOpen(true);
    };

    const handleSaveOrganization = async () => {
        if (!orgName.trim()) {
            Alert.alert('Error', 'Organization name is required');
            return;
        }

        try {
            setEditLoading(true);
            await api.updateOrganization(orgId, {
                name: orgName.trim(),
                description: orgDescription.trim() || undefined
            });

            // Reload organization data
            await loadOrganization();

            Alert.alert('Success', 'Organization updated successfully');
            setIsEditModalOpen(false);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update organization');
        } finally {
            setEditLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
    };

    const handleDeleteOrganization = () => {
        Alert.alert(
            "Delete Organization",
            `Are you sure you want to delete "${organization?.name}"? This action cannot be undone. All schedules, employees, and data will be permanently removed.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Organization",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.deleteOrganization(orgId);
                            Alert.alert('Success', 'Organization deleted successfully');
                            router.replace('/(app)/forkPage');
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete organization');
                        }
                    }
                }
            ]
        );
    };

    const handleManageInviteLinks = () => {
        // Navigate to employee page where invite links are managed
        router.push(`/(app)/${orgId}/employees`);
    };

    const isOwner = organization?.ownerId === user?.id;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Organization Settings</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Organization Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Organization Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ORGANIZATION</Text>
                    <View style={styles.card}>
                        <View style={styles.orgHeader}>
                            <View style={styles.orgIcon}>
                                <Building2 size={24} color="#818cf8" />
                            </View>
                            <View style={styles.orgInfo}>
                                <Text style={styles.orgName}>{organization?.name}</Text>
                                <Text style={styles.orgDescription}>
                                    {organization?.description || 'No description'}
                                </Text>
                                <Text style={styles.orgOwner}>
                                    Owner: {organization?.owner.firstName} {organization?.owner.lastName}
                                </Text>
                            </View>
                        </View>

                        {isOwner && (
                            <>
                                <View style={styles.separator} />
                                <SettingsItem
                                    icon={<Building2 size={20} color="#94a3b8" />}
                                    label="Edit Organization"
                                    onPress={handleEditOrganization}
                                />
                            </>
                        )}
                    </View>
                </View>

                {/* General Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>GENERAL</Text>
                    <View style={styles.card}>
                        <SettingsItem
                            icon={<Users size={20} color="#94a3b8" />}
                            label="Manage Employees"
                            onPress={() => router.push(`/(app)/${orgId}/employees`)}
                        />
                        <View style={styles.separator} />
                    </View>
                </View>

                {/* Danger Zone Section (Owner Only) */}
                {isOwner && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>DANGER ZONE</Text>
                        <View style={[styles.card, styles.dangerCard]}>
                            <TouchableOpacity
                                style={styles.row}
                                onPress={handleDeleteOrganization}
                                activeOpacity={0.7}
                            >
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                        <Trash2 size={20} color="#ef4444" />
                                    </View>
                                    <View>
                                        <Text style={[styles.rowLabel, { color: '#ef4444' }]}>Delete Organization</Text>
                                        <Text style={styles.dangerSubtext}>
                                            Permanently delete this organization{'\n'}
                                            and all its data
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {!isOwner && (
                    <View style={styles.section}>
                        <Text style={styles.infoText}>
                            Only the organization owner can modify these settings.
                        </Text>
                    </View>
                )}

            </ScrollView>

            {/* Edit Organization Modal */}
            <Modal
                visible={isEditModalOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCancelEdit}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Organization</Text>
                        <TouchableOpacity onPress={handleCancelEdit}>
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {/* Organization Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Organization Name</Text>
                            <TextInput
                                style={styles.input}
                                value={orgName}
                                onChangeText={setOrgName}
                                placeholder="Enter organization name"
                                placeholderTextColor="#64748b"
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Organization Description */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={orgDescription}
                                onChangeText={setOrgDescription}
                                placeholder="Enter organization description"
                                placeholderTextColor="#64748b"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, editLoading && styles.submitButtonDisabled]}
                            onPress={handleSaveOrganization}
                            disabled={editLoading}
                        >
                            {editLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Reusable Component
function SettingsItem({ icon, label, onPress }: { icon: React.ReactNode, label: string, onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                    {icon}
                </View>
                <Text style={styles.rowLabel}>{label}</Text>
            </View>
            <ChevronRight size={20} color="#334155" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
        overflow: 'hidden',
    },
    dangerCard: {
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    orgHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
    },
    orgIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    orgInfo: {
        flex: 1,
    },
    orgName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    orgDescription: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 4,
    },
    orgOwner: {
        fontSize: 13,
        color: '#64748b',
    },
    separator: {
        height: 1,
        backgroundColor: '#1e293b',
        marginLeft: 56,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        minHeight: 56,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconBox: {
        width: 24,
        alignItems: 'center',
        marginRight: 16,
    },
    rowLabel: {
        fontSize: 16,
        color: '#e2e8f0',
        fontWeight: '400',
    },
    dangerSubtext: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 2,
    },
    infoText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#020617',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },
    closeText: {
        color: '#4f46e5',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContent: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e2e8f0',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#ffffff',
    },
    textArea: {
        height: 100,
        paddingTop: 16,
    },
    submitButton: {
        backgroundColor: '#4f46e5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});
