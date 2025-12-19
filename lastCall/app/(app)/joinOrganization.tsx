import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { QrCode, ArrowLeft } from 'lucide-react-native';
import { api } from '@/lib/api';

export default function JoinOrganization() {
    const router = useRouter();

    // Form State
    const [inviteToken, setInviteToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Logic: Stubbed Backend Connection
    const handleJoin = async () => {
        if (!inviteToken.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Extract token from URL or use as-is
            const cleanToken = inviteToken.includes('/invite/')
                ? inviteToken.split('/invite/')[1].trim()
                : inviteToken.trim();

            const result = await api.joinOrganization(cleanToken);

            // Show success message
            Alert.alert(
                'Request Sent!',
                result.message || 'Your request is pending admin approval.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(app)/forkPage')
                    }
                ]
            );
        } catch (err: any) {
            setError(err.message || 'Failed to join organization. Please check the invite code and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardContainer}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.contentContainer}>

                        {/* Header Section */}
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.back()}
                                activeOpacity={0.7}
                            >
                                <ArrowLeft size={24} color="#94a3b8" />
                            </TouchableOpacity>
                            <Text style={styles.title}>Join Workspace</Text>
                            <Text style={styles.subtitle}>
                                Enter the invite code shared by your manager to join their organization.
                            </Text>
                        </View>

                        {/* Form Section */}
                        <View style={styles.form}>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Invite Code or Invite Link</Text>
                                <View style={[
                                    styles.inputContainer,
                                    inviteToken.length > 0 && styles.inputContainerActive,
                                    !!error && styles.inputContainerError
                                ]}>
                                    <QrCode size={20} color="#64748b" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. abc-123-xyz"
                                        placeholderTextColor="#475569"
                                        value={inviteToken}
                                        onChangeText={(text) => {
                                            setInviteToken(text);
                                            if (error) setError(null); // Clear error on type
                                        }}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                                {/* Error Message Display */}
                                {error && (
                                    <Text style={styles.errorText}>{error}</Text>
                                )}
                            </View>

                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>
                                    Note: Joining an organization usually requires admin approval before you can see schedules.
                                </Text>
                            </View>

                        </View>

                        {/* Action Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.joinButton, (!inviteToken.trim() || loading) && styles.joinButtonDisabled]}
                                onPress={handleJoin}
                                disabled={!inviteToken.trim() || loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.joinButtonText}>Join Organization</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Layout
    container: {
        flex: 1,
        backgroundColor: '#020617', // App Background (Slate 950)
    },
    keyboardContainer: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },

    // Header
    header: {
        marginBottom: 32,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        marginBottom: 16,
        marginLeft: -8,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8', // Slate 400
        lineHeight: 24,
    },

    // Form
    form: {
        flex: 1,
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#cbd5e1', // Slate 300
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a', // Surface (Slate 900)
        borderWidth: 1,
        borderColor: '#1e293b', // Subtle Border
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 16,
    },
    inputContainerActive: {
        borderColor: '#334155', // Active Border
    },
    inputContainerError: {
        borderColor: '#ef4444', // Red-500 for errors
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
        height: '100%',
    },
    errorText: {
        fontSize: 14,
        color: '#ef4444', // Red-500
        marginLeft: 4,
        marginTop: 4,
    },

    // Info Box
    infoBox: {
        padding: 16,
        backgroundColor: 'rgba(30, 41, 59, 0.5)', // Transparent Slate-800
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    infoText: {
        fontSize: 14,
        color: '#64748b', // Slate 500
        lineHeight: 20,
    },

    // Footer / Buttons
    footer: {
        paddingVertical: 24,
    },
    joinButton: {
        backgroundColor: '#4f46e5', // Brand Indigo
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    joinButtonDisabled: {
        backgroundColor: '#1e293b', // Slate 800
        shadowOpacity: 0,
        elevation: 0,
    },
    joinButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});