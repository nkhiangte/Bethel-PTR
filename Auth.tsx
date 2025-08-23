import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import type { User } from './types';
import App from './App.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { RegistrationPage } from './components/RegistrationPage.tsx';
import { ForgotPasswordPage } from './components/ForgotPasswordPage.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';


export const Auth: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const tokenResult = await firebaseUser.getIdTokenResult();
                const claims = tokenResult.claims;
                
                const appUser: User = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    isAdmin: claims.isAdmin === true,
                    assignedBial: claims.assignedBial as string | null || null
                };
                setUser(appUser);
            } else {
                setUser(null);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await firebaseSignOut(getFirebaseAuth());
            setUser(null);
            setView('login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    if (authLoading) {
        return <LoadingSpinner message="Authenticating..." className="min-h-screen" />;
    }

    if (!user) {
        switch (view) {
            case 'register':
                return <RegistrationPage onSwitchToLogin={() => setView('login')} />;
            case 'forgotPassword':
                return <ForgotPasswordPage onSwitchToLogin={() => setView('login')} />;
            default:
                return <LoginPage onSwitchToRegister={() => setView('register')} onSwitchToForgotPassword={() => setView('forgotPassword')} />;
        }
    }

    return <App user={user} onLogout={handleLogout} />;
};
