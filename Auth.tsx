import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import * as api from './api.ts';
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
        const auth = getFirebaseAuth();
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Fetch user roles from Firestore instead of claims
                const userDoc = await api.fetchUserDocument(firebaseUser.uid);
                
                if (userDoc) {
                    const appUser: User = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        isAdmin: userDoc.isAdmin,
                        assignedBial: userDoc.assignedBial,
                    };
                    setUser(appUser);
                } else {
                    // This can happen if user is authenticated but their Firestore doc was deleted.
                    // Safest to log out.
                    console.error(`User document not found for UID: ${firebaseUser.uid}. Forcing logout.`);
                    await firebaseSignOut(auth);
                    setUser(null);
                }
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