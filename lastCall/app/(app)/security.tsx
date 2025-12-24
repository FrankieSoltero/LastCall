import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Lock,
    Eye,
    EyeOff,
    Trash2,
    ChevronRight,
    ShieldAlert
} from 'lucide-react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function SecurityPage() {
    const router = useRouter();
    const { signOut, changePassword } = useAuth();

    // State for privacy toggles
    const [shareEmail, setShareEmail] = useState(true);
    const [sharePhone, setSharePhone] = useState(false);
    const [loading, setLoading] = useState(true);

    // Password change modal state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        const loadPrivacySettings = async () => {
            try {
                const user = await api.getUserProfile();
                setShareEmail(user.shareEmail);
                setSharePhone(user.sharePhone);
            } catch (error) {
                console.error('Failed to load privacy settings:', error);
                Alert.alert('Error', 'Failed to load privacy settings');
            } finally {
                setLoading(false);
            }
        }
        loadPrivacySettings();
    }, []);

    const handleShareEmailToggle = async (value: boolean) => {
        setShareEmail(value);
        try {
            await api.updatePrivacySettings({ shareEmail: value });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update privacy settings');
            setShareEmail(!value);
        }
    }

    const handleSharePhoneToggle = async (value: boolean) => {
        setSharePhone(value);
        try {
            await api.updatePrivacySettings({ sharePhone: value });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update privacy settings');
            setSharePhone(!value);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This action cannot be undone. All your data, schedules, and organization memberships will be permanently removed.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete My Account",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.deleteUser();
                            await signOut();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete account');
                        }
                    }
                }
            ]
        );
    };

    const handleChangePassword = () => {
        setIsPasswordModalOpen(true);
    };

    const handlePasswordSubmit = async () => {
        // Validation
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            setPasswordLoading(true);
            await changePassword(newPassword);

            Alert.alert('Success', 'Your password has been updated successfully');
            setIsPasswordModalOpen(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleCancelPasswordChange = () => {
        setNewPassword('');
        setConfirmPassword('');
        setIsPasswordModalOpen(false);
    };

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
                    <Text style={styles.headerTitle}>Security & Privacy</Text>
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
                <Text style={styles.headerTitle}>Security & Privacy</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Login & Security Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>LOGIN & SECURITY</Text>
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={styles.row}
                            onPress={handleChangePassword}
                            activeOpacity={0.7}
                        >
                            <View style={styles.rowLeft}>
                                <View style={styles.iconBox}>
                                    <Lock size={20} color="#94a3b8" />
                                </View>
                                <View>
                                    <Text style={styles.rowLabel}>Change Password</Text>
                                    <Text style={styles.rowSubLabel}>Last changed 3 months ago</Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color="#334155" />
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        <TouchableOpacity
                            style={styles.row}
                            activeOpacity={0.7}
                            // Placeholder for future 2FA implementation
                            onPress={() => Alert.alert("Coming Soon", "Two-factor authentication is coming soon.")}
                        >
                            <View style={styles.rowLeft}>
                                <View style={styles.iconBox}>
                                    <ShieldAlert size={20} color="#94a3b8" />
                                </View>
                                <Text style={styles.rowLabel}>Two-Factor Authentication</Text>
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>SOON</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Privacy Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PRIVACY SETTINGS</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconBox}>
                                    {shareEmail ? (
                                        <Eye size={20} color="#94a3b8" />
                                    ) : (
                                        <EyeOff size={20} color="#94a3b8" />
                                    )}
                                </View>
                                <View>
                                    <Text style={styles.rowLabel}>Share Email with Team</Text>
                                    <Text style={styles.rowSubLabel}>Visible in employee directory</Text>
                                </View>
                            </View>
                            <Switch
                                value={shareEmail}
                                onValueChange={handleShareEmailToggle}
                                trackColor={{ false: '#1e293b', true: '#4f46e5' }}
                                thumbColor={'#ffffff'}
                            />
                        </View>
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconBox}>
                                    {sharePhone ? (
                                        <Eye size={20} color="#94a3b8" />
                                    ) : (
                                        <EyeOff size={20} color="#94a3b8" />
                                    )}
                                </View>
                                <View>
                                    <Text style={styles.rowLabel}>Share Phone with Team</Text>
                                    <Text style={styles.rowSubLabel}>Visible in employee directory</Text>
                                </View>
                            </View>
                            <Switch
                                value={sharePhone}
                                onValueChange={handleSharePhoneToggle}
                                trackColor={{ false: '#1e293b', true: '#4f46e5' }}
                                thumbColor={'#ffffff'}
                            />
                        </View>
                    </View>
                    <Text style={styles.helperText}>
                        Admins will always be able to see your contact information for scheduling purposes.
                    </Text>
                </View>

                {/* Danger Zone Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>DANGER ZONE</Text>
                    <View style={[styles.card, styles.dangerCard]}>
                        <TouchableOpacity
                            style={styles.row}
                            onPress={handleDeleteAccount}
                            activeOpacity={0.7}
                        >
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                    <Trash2 size={20} color="#ef4444" />
                                </View>
                                <Text style={[styles.rowLabel, { color: '#ef4444' }]}>Delete Account</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            {/* Password Change Modal */}
            <Modal
                visible={isPasswordModalOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCancelPasswordChange}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <TouchableOpacity onPress={handleCancelPasswordChange}>
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.modalDescription}>
                            Enter your new password below. Password must be at least 6 characters.
                        </Text>

                        {/* New Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>New Password</Text>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                                placeholderTextColor="#64748b"
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Confirm New Password</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                placeholderTextColor="#64748b"
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, passwordLoading && styles.submitButtonDisabled]}
                            onPress={handlePasswordSubmit}
                            disabled={passwordLoading}
                        >
                            {passwordLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Update Password</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617', // Void Background
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b', // Slate-500
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: '#0f172a', // Surface
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1e293b', // Subtle Border
        overflow: 'hidden',
    },
    dangerCard: {
        borderColor: 'rgba(239, 68, 68, 0.2)', // Red border for danger
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
        paddingRight: 16,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        backgroundColor: 'rgba(148, 163, 184, 0.1)', // Subtle icon background
    },
    rowLabel: {
        fontSize: 16,
        color: '#e2e8f0',
        fontWeight: '400',
        marginBottom: 2,
    },
    rowSubLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    separator: {
        height: 1,
        backgroundColor: '#1e293b',
        marginLeft: 64, // Align with text
    },
    helperText: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 8,
        marginLeft: 4,
        lineHeight: 20,
    },
    badge: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#334155',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
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
    modalDescription: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 24,
        lineHeight: 20,
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