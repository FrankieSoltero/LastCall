import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { supabase } from '@/lib/supabase'; // Access Supabase directly for reset

export default function ForgotPassword() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            // Standard Supabase Password Reset Flow
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'exp://localhost:8081/account/update-password', // Update for production
            });

            if (error) throw error;

            Alert.alert(
                'Check your inbox',
                'We have sent a password reset link to your email.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                        Enter the email associated with your account and we'll send you a link to reset your password.
                    </Text>

                    {/* Form */}
                    <View style={styles.form}>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputContainer}>
                                <Mail size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="name@work.com"
                                    placeholderTextColor="#64748b"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* Action Button */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#020617" />
                            ) : (
                                <Text style={styles.buttonText}>Send Instructions</Text>
                            )}
                        </TouchableOpacity>

                        {/* Footer Back Link */}
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.linkText}>Return to Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617', // Slate-950
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8', // Slate-400
        marginBottom: 32, // Slightly reduced from Login to fit content better
        lineHeight: 24,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#cbd5e1', // Slate-300
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a', // Slate-900
        borderWidth: 1,
        borderColor: '#1e293b', // Slate-800
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 16,
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
    button: {
        backgroundColor: '#ffffff',
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#020617',
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    linkText: {
        color: '#818cf8', // Indigo-400
        fontWeight: '600',
    },
});