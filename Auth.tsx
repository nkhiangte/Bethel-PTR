import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import type { User } from './types';
import App from './App.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { RegistrationPage } from './components/RegistrationPage.tsx';
import { ForgotPasswordPage } from './components/ForgotPasswordPage.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import { ConfigPage } from './components/ConfigPage.tsx';
import { isFirebaseConfigured, initializeFirebase } from './firebase.ts';


export const Auth: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');
    const [configStatus, setConfigStatus] = useState<'checking' | 'configured' | 'unconfigured'>('checking');
    const [firebaseError, setFirebaseError] = useState<string | null>(null);

    useEffect(() => {
        if (isFirebaseConfigured()) {
            try {
                initializeFirebase();
                setConfigStatus('configured');
                setFirebaseError(null);
            } catch (error: any) {
                console.error("Firebase initialization failed:", error);
                setFirebaseError(`Firebase initialization failed: ${error.message}. Please check your configuration.`);
                setConfigStatus('unconfigured');
            }
        } else {
            setConfigStatus('unconfigured');
        }
    }, []);

    useEffect(() => {
        if (configStatus !== 'configured') {
            setAuthLoading(false);
            return;
        };

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
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
    }, [configStatus]);

    const handleLogout = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setView('login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const handleConfigSaved = () => {
        try {
            initializeFirebase();
            setConfigStatus('configured');
            setFirebaseError(null);
            // Re-run auth check
            setAuthLoading(true);
        } catch (error: any) {
             console.error("Firebase initialization failed after saving config:", error);
             setFirebaseError(`Firebase initialization failed: ${error.message}. Please verify the saved configuration.`);
             setConfigStatus('unconfigured');
        }
    }

    if (configStatus === 'checking' || authLoading) {
        return <LoadingSpinner message="Authenticating..." className="min-h-screen" />;
    }

    if (configStatus === 'unconfigured') {
        return <ConfigPage onConfigSaved={handleConfigSaved} error={firebaseError} />;
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