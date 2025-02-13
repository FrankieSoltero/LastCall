import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { browserLocalPersistence, browserSessionPersistence, getAuth, onAuthStateChanged, setPersistence, User } from 'firebase/auth';
import { app, auth } from './firebaseConfig';
import { View, Text } from 'react-native';

interface AuthContextType {
    user:User | null;
    loading: boolean;
}

//This is where we create our auth context
const AuthContext = createContext<AuthContextType | undefined>({
    user: null,
    loading: true,
});

//Creating a custom hook goes here
export const useAuth = () => {
    //We get the context of what we are storing through the interface AuthContext
    const context = useContext(AuthContext);
    //This forces us to wrap out navigator in a AuthProvider hook
    if(!context){
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
//Here is what the actual auth provider does, it takes in a child within the ReactNode
export function AuthProvider ({ children }: { children: ReactNode}): React.JSX.Element {
    //Here we get the user that is currently using the platform
    const [user, setUser] = useState<User | null>(null);
    //Here we get a loading function where if it is loading to enable a loading screen
    const [loading, setLoading] = useState(true);
    //We use the useEffect to create a state variable that will change whenever a user is logged out or logged in and subscribes to the event
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    //This is what the authContext will look like when used in our layouts
    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}