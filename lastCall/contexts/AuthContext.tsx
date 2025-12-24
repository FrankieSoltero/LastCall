import React, {createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { UserBasic } from '@/types/api';
import { useNotifications } from '@/hooks/useNotifications';

type User = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signUp: (email: string, password: string, phone: string, firstName: string, lastName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const justSignedUp = useRef(false);
    const justChangedPassword = useRef(false);

    // Set up push notifications (only registers when user is authenticated)
    useNotifications();

    const loadDbUser = async () => {
        try {
            const dbUser = await api.getCurrentUser();
            setUser(dbUser);
        } catch (error) {
            console.error('Error loading user:', error);
            setUser(null);
        }
    }

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        if(data.user) {
            await loadDbUser();
        }
    }

    const signUp = async (
        email: string,
        password: string,
        phone: string,  
        firstName: string,
        lastName: string
    ) => {
        justSignedUp.current = true;
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            phone: phone
        });

        if (error) {
            justSignedUp.current = false;
            throw error;
        };
        if (!data.user) throw new Error('No user returned');

        try {
            await api.post<UserBasic>('/users', {
                id: data.user.id,
                email,
                phone,
                firstName,
                lastName
            });
            await loadDbUser();
        } catch (error) {
            console.error('Error creating a user in database:', error);
            throw error;
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
    }

    const refreshUser = async () => {
        await loadDbUser();
    }

    const changePassword = async (newPassword: string) => {
        justChangedPassword.current = true;
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            justChangedPassword.current = false;
            throw error;
        }
        // No need to reload user data since DB didn't change
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session }}) => {
            setSession(session);
            if(session?.user) {
                loadDbUser();
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription }} = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                if (session?.user) {
                    if (justSignedUp.current) {
                        justSignedUp.current = false;
                    } else if (justChangedPassword.current) {
                        justChangedPassword.current = false;
                    } else {
                        await loadDbUser();
                    }
                } else {
                    setUser(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe()
    }, []);

    return (
        <AuthContext.Provider value={{ session, user, loading, signIn, signOut, signUp, refreshUser, changePassword}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context
}