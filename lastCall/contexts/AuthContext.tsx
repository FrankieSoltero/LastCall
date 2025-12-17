import React, {createContext, use, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import prisma from '@/lib/prisma';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    dbUser: any | null;
    loading: boolean;
    signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [dbUser, setDbUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session }}) => {
            setSession(session)
            setUser(session?.user || null);

            if(session?.user) {
                loadDbUser(session.user.id);
            } else {
                setDbUser(null);
                setLoading(false);
            }

        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user || null);

            if (session?.user) {
                loadDbUser(session.user.id);
            } else {
                setDbUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe()
    }, [])

    async function loadDbUser(userId: string) {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                include: {
                    ownedOrgs: true,
                    employees: {
                        include: {
                            organization: true
                        }
                    }
                }
            })
            setDbUser(user);
        } catch (error: any) {
            console.error("Error loading from database", error);
        } finally {
            setLoading(false)
        }
    }
    async function signUp(email: string, password: string, firstName: string, lastName: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        if (data.user) {
            await prisma.user.create({
                data: {
                    id: data.user.id,
                    email,
                    firstName,
                    lastName
                }
            })
        }
    }
    async function signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
    }
    async function signOut() {
        const { error } = await supabase.auth.signOut();

        if (error) throw error
    }

    const value = {
        session,
        user,
        dbUser,
        loading,
        signUp,
        signIn,
        signOut
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context
}