import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    User,
    Bell,
    Calendar,
    Shield,
    LogOut,
    ChevronRight,
    ChevronLeft,
    Moon,
    Smartphone
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '@/lib/api';
import { useUserProfile } from '@/lib/queries';

export default function SettingsPage() {
    const router = useRouter();
    const { signOut, user, refreshUser } = useAuth();

    // React Query hook
    const { data: userProfile, isLoading: loading } = useUserProfile();

    const [pushEnabled, setPushEnabled] = useState(userProfile?.pushEnabled ?? true);
    const [emailEnabled, setEmailEnabled] = useState(userProfile?.emailEnabled ?? false);

    // Sync with fetched data
    useEffect(() => {
        if (userProfile) {
            setPushEnabled(userProfile.pushEnabled);
            setEmailEnabled(userProfile.emailEnabled);
        }
    }, [userProfile]);

    // Edit Profile Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);

    const handlePushToggle = async (value: boolean) => {
        setPushEnabled(value);
        try {
            await api.updateNotificationPreferences({ pushEnabled: value });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update notification settings');
            setPushEnabled(!value);
        }
    };

    const handleEmailToggle = async (value: boolean) => {
        setEmailEnabled(value);
        try {
            await api.updateNotificationPreferences({ emailEnabled: value });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update notification settings');
            setEmailEnabled(!value);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: () => signOut()
                }
            ]
        );
    };

    const handleEditProfile = () => {
        // Pre-populate with current user data
        setFirstName(user?.firstName || '');
        setLastName(user?.lastName || '');
        setEmail(user?.email || '');
        setPhone(user?.phone || ''); // Phone isn't in the basic user type from AuthContext
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = async () => {
        // Validation
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setProfileLoading(true);
            await api.updateUserProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                phone: phone.trim()
            });

            // Refresh user data in AuthContext
            await refreshUser();

            Alert.alert('Success', 'Profile updated successfully');
            setIsEditModalOpen(false);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
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
                    <Text style={styles.headerTitle}>Settings</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Updated Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACCOUNT</Text>
                    <View style={styles.card}>
                        <View style={styles.profileHeader}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {user?.firstName?.[0] || 'U'}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.profileName}>
                                    {user?.firstName} {user?.lastName}
                                </Text>
                                <Text style={styles.profileEmail}>{user?.email}</Text>
                            </View>
                        </View>

                        <View style={styles.separator} />

                        <SettingsItem
                            icon={<User size={20} color="#94a3b8" />}
                            label="Edit Profile"
                            onPress={handleEditProfile}
                        />
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PREFERENCES</Text>
                    <View style={styles.card}>
                        <SettingsItem
                            icon={<Calendar size={20} color="#94a3b8" />}
                            label="General Availability"
                            onPress={() => router.push('/(app)/generalAvailability')}
                        />
                        <View style={styles.separator} />
                        <SettingsItem
                            icon={<Shield size={20} color="#94a3b8" />}
                            label="Security & Privacy"
                            onPress={() => router.push('/(app)/security')}
                        />
                    </View>
                </View>

                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconBox}>
                                    <Smartphone size={20} color="#94a3b8" />
                                </View>
                                <Text style={styles.rowLabel}>Push Notifications</Text>
                            </View>
                            <Switch
                                value={pushEnabled}
                                onValueChange={handlePushToggle}
                                trackColor={{ false: '#1e293b', true: '#4f46e5' }}
                                thumbColor={'#ffffff'}
                            />
                        </View>

                        <View style={styles.separator} />

                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconBox}>
                                    <Bell size={20} color="#94a3b8" />
                                </View>
                                <Text style={styles.rowLabel}>Email Alerts</Text>
                            </View>
                            <Switch
                                value={emailEnabled}
                                onValueChange={handleEmailToggle}
                                trackColor={{ false: '#1e293b', true: '#4f46e5' }}
                                thumbColor={'#ffffff'}
                            />
                        </View>
                    </View>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>APPEARANCE</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <View style={styles.iconBox}>
                                    <Moon size={20} color="#94a3b8" />
                                </View>
                                <Text style={styles.rowLabel}>Dark Mode</Text>
                            </View>
                            <Text style={styles.valueText}>Stays on for now</Text>
                        </View>
                    </View>
                </View>

                {/* Logout Section */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        activeOpacity={0.7}
                        onPress={handleSignOut}
                    >
                        <LogOut size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}>LastCall v1.0.0 (Build 42)</Text>
                </View>

            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={isEditModalOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCancelEdit}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <TouchableOpacity onPress={handleCancelEdit}>
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {/* First Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>First Name</Text>
                            <TextInput
                                style={styles.input}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="Enter first name"
                                placeholderTextColor="#64748b"
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Last Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Last Name</Text>
                            <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Enter last name"
                                placeholderTextColor="#64748b"
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter email"
                                placeholderTextColor="#64748b"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Phone */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Enter phone number"
                                placeholderTextColor="#64748b"
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, profileLoading && styles.submitButtonDisabled]}
                            onPress={handleSaveProfile}
                            disabled={profileLoading}
                        >
                            {profileLoading ? (
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
        backgroundColor: '#020617', // Void Background
    },
    header: {
        flexDirection: 'row', // Align items horizontally
        alignItems: 'center', // Center vertically
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    backButton: {
        marginRight: 16, // Space between arrow and title
        padding: 4, // Hit slop area
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
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    avatar: {
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
    avatarText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#818cf8', // Indigo Accent
    },
    profileName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 2,
    },
    profileEmail: {
        fontSize: 14,
        color: '#94a3b8',
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
        height: 56,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
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
    valueText: {
        fontSize: 14,
        color: '#64748b',
        marginRight: 8,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        borderRadius: 12,
        padding: 16,
        height: 56,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
        marginLeft: 8,
    },
    versionText: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 12,
        color: '#475569',
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