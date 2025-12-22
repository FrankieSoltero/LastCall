import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QrCode, Building2, ChevronRight, LogOut, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { OrganizationWithCounts } from '@/types/api';


export default function DashboardOrFork() {
    const router = useRouter();
    const { user, signOut } = useAuth(); // Assuming signOut exists in your context
    const [loading, setLoading] = useState(true);

    // Changed from boolean to Array to store the actual data
    const [userOrgs, setUserOrgs] = useState<OrganizationWithCounts[]>([]);

    useEffect(() => {
        checkUserOrgs();
    }, []);

    const checkUserOrgs = async () => {
        try {
            const orgs = await api.getOrganizations();
            if (orgs && orgs.length > 0) {
                setUserOrgs(orgs);
            } else {
                setUserOrgs([]);
            }
        } catch (error) {
            console.error('Failed to check orgs', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnterOrg = (orgId: string) => {
        // Navigate to the dynamic route for the specific organization
        router.push(`/(app)/${orgId}`);
    };

    // 1. Loading State
    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    // 2. LOBBY STATE (User has memberships)
    if (userOrgs.length > 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />

                <View style={styles.header}>
                    <Text style={styles.welcomeText}>Welcome back,</Text>
                    <Text style={styles.nameText}>{user?.firstName}</Text>
                    <Text style={styles.subText}>Select a workspace to continue.</Text>
                </View>

                {/* List of Organizations */}
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {userOrgs.map((org) => (
                        <TouchableOpacity
                            key={org.id}
                            style={styles.orgCard}
                            activeOpacity={0.7}
                            onPress={() => handleEnterOrg(org.id)}
                        >
                            <View style={styles.orgIconBubble}>
                                <Building2 size={24} color="#fff" />
                            </View>
                            <View style={styles.orgCardContent}>
                                <Text style={styles.orgName}>{org.name}</Text>
                                <Text style={styles.orgCount}>
                                    {org._count.employees} {org._count.employees === 1 ? 'member' : 'members'}
                                </Text>
                            </View>
                            <ChevronRight size={20} color="#475569" />
                        </TouchableOpacity>
                    ))}

                    {/* Join/Create Options */}
                    <View style={styles.divider} />

                    {/* JOIN CARD */}
                    <TouchableOpacity
                        style={styles.addOrgCard}
                        activeOpacity={0.8}
                        onPress={() => router.push('/(app)/joinOrganization')}
                    >
                        <View style={styles.addOrgIconBubble}>
                            <QrCode size={28} color="#818cf8" />
                        </View>
                        <View style={styles.addOrgContent}>
                            <Text style={styles.addOrgTitle}>Join a Team</Text>
                            <Text style={styles.addOrgDesc}>I have an invite code</Text>
                        </View>
                        <ChevronRight size={20} color="#475569" />
                    </TouchableOpacity>

                    {/* CREATE CARD */}
                    <TouchableOpacity
                        style={styles.addOrgCard}
                        activeOpacity={0.8}
                        onPress={() => router.push('/(app)/createOrganization')}
                    >
                        <View style={[styles.addOrgIconBubble, { backgroundColor: 'rgba(52, 211, 153, 0.1)' }]}>
                            <Building2 size={28} color="#34d399" />
                        </View>
                        <View style={styles.addOrgContent}>
                            <Text style={styles.addOrgTitle}>Create Business</Text>
                            <Text style={styles.addOrgDesc}>Set up my workspace</Text>
                        </View>
                        <ChevronRight size={20} color="#475569" />
                    </TouchableOpacity>

                    {/* AVAILABILITY CARD */}
                    <TouchableOpacity
                        style={styles.addOrgCard}
                        activeOpacity={0.8}
                        onPress={() => router.push('/(app)/generalAvailability')}
                    >
                        <View style={[styles.addOrgIconBubble, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                            <Calendar size={28} color="#a855f7" />
                        </View>
                        <View style={styles.addOrgContent}>
                            <Text style={styles.addOrgTitle}>General Availability</Text>
                            <Text style={styles.addOrgDesc}>Set my default schedule</Text>
                        </View>
                        <ChevronRight size={20} color="#475569" />
                    </TouchableOpacity>
                </ScrollView>
                <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                    <LogOut size={20} color="#475569" style={{ marginRight: 8 }} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // 3. ONBOARDING STATE (No Orgs)
    // This remains mostly the same as your original code
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.welcomeText}>Hello, {user?.firstName}.</Text>
                <Text style={styles.subText}>You aren't part of any team yet.</Text>
                <Text style={styles.subText}>How would you like to start?</Text>
            </View>

            <View style={styles.cardsContainer}>
                {/* JOIN */}
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={() => router.push('/(app)/joinOrganization')}
                >
                    <View style={styles.iconBubble}>
                        <QrCode size={32} color="#818cf8" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Join a Team</Text>
                        <Text style={styles.cardDesc}>I have an invite code.</Text>
                    </View>
                </TouchableOpacity>

                {/* CREATE */}
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={() => router.push('/(app)/createOrganization')}
                >
                    <View style={[styles.iconBubble, { backgroundColor: 'rgba(52, 211, 153, 0.1)' }]}>
                        <Building2 size={32} color="#34d399" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Create Business</Text>
                        <Text style={styles.cardDesc}>I want to set up my bar.</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                <LogOut size={20} color="#475569" style={{ marginRight: 8 }} />
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617', // Slate-950
        paddingHorizontal: 24,
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#020617',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Typography
    header: {
        marginTop: 40,
        marginBottom: 32,
    },
    welcomeText: {
        fontSize: 20,
        color: '#94a3b8', // Slate-400
    },
    nameText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: '#64748b', // Slate-500
        lineHeight: 24,
    },
    // Lobby Org List Styles
    listContainer: {
        paddingBottom: 40,
    },
    orgCard: {
        backgroundColor: '#1e293b', // Slate-800
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    orgIconBubble: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#3b82f6', // Blue-500
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    orgCardContent: {
        flex: 1,
    },
    orgName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    orgCount: {
        fontSize: 14,
        color: '#94a3b8',
    },
    divider: {
        height: 1,
        backgroundColor: '#1e293b',
        marginVertical: 24,
    },
    addOrgCard: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    addOrgIconBubble: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(129, 140, 248, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    addOrgContent: {
        flex: 1,
    },
    addOrgTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    addOrgDesc: {
        fontSize: 13,
        color: '#64748b',
    },
    // Onboarding Card Styles
    cardsContainer: {
        gap: 16,
    },
    card: {
        backgroundColor: '#0f172a', // Slate-900
        borderWidth: 1,
        borderColor: '#1e293b',
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBubble: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(129, 140, 248, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 6,
    },
    cardDesc: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    signOutButton: {
        marginTop: 40,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    signOutText: {
        color: '#475569',
        fontSize: 16,
        fontWeight: '500',
    },
});