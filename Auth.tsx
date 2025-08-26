import React, { useState, useEffect } from 'react';
// Fix: Import firebase v8 compat and auth instance
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from './firebase.ts';
import * as api from './api.ts';
import type { User } from './types.ts';
import App from './App.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { RegistrationPage } from './components/RegistrationPage.tsx';
import { ForgotPasswordPage } from './components/ForgotPasswordPage.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';

// Fix: Define FirebaseUser type for v8 compat
type FirebaseUser = firebase.User;

export const Auth: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');

    useEffect(() => {
        // Fix: Use v8 compat onAuthStateChanged
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                let userDoc = await api.fetchUserDocument(firebaseUser.uid);

                // If user exists in Auth but not Firestore, attempt to create their document.
                // This handles cases where registration was incomplete.
                if (!userDoc) {
                    console.log(`User document not found for UID: ${firebaseUser.uid}. Attempting to create it.`);
                    try {
                        await api.createUserDocument(firebaseUser);
                        userDoc = await api.fetchUserDocument(firebaseUser.uid); // Re-fetch the document
                    } catch (error) {
                        console.error(`Failed to create user document for UID: ${firebaseUser.uid}. Forcing logout.`, error);
                        // Fix: Use v8 compat signOut
                        await auth.signOut();
                        setUser(null);
                        setAuthLoading(false);
                        return;
                    }
                }
                
                if (userDoc) {
                    const appUser: User = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        isAdmin: userDoc.isAdmin,
                        assignedBial: userDoc.assignedBial,
                    };

                    // HOTFIX: Ensure the specified user is always an admin,
                    // overriding the value from the database if necessary.
                    // This resolves the issue of an existing user not getting admin rights.
                    if (appUser.email === 'nkhiangte@gmail.com') {
                        appUser.isAdmin = true;
                    }

                    setUser(appUser);
                } else {
                    // This case should be rare now, but as a safeguard:
                    console.error(`User document still not found for UID: ${firebaseUser.uid} after creation attempt. Forcing logout.`);
                    // Fix: Use v8 compat signOut
                    await auth.signOut();
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
            // Fix: Use v8 compat signOut
            await auth.signOut();
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
