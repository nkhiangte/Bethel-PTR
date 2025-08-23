import React, { useState, useEffect } from 'react';
import App from './App.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import * as api from './api.ts';
import { auth } from './firebase.ts';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';

interface AuthState {
    isAuthenticated: boolean;
    assignedBial: string | null;
    isLoading: boolean;
}

const Auth: React.FC = () => {
    const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, assignedBial: null, isLoading: true });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Test for firebase config placeholder
        if (api.isFirebaseConfigPlaceholder()) {
            setError('Firebase is not configured. Please add your firebaseConfig to firebase.ts');
            setAuth(prev => ({ ...prev, isLoading: false }));
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (user) {
                try {
                    const assignedBial = await api.getAssignedBial(user.uid);
                    setAuth({ isAuthenticated: true, assignedBial, isLoading: false });
                } catch (e) {
                    console.error("Error fetching user data:", e);
                    // Log out the user if their data can't be fetched, as it's a critical error
                    await api.logout();
                    setAuth({ isAuthenticated: false, assignedBial: null, isLoading: false });
                }
            } else {
                setAuth({ isAuthenticated: false, assignedBial: null, isLoading: false });
            }
        });

        return () => unsubscribe(); // Cleanup subscription on unmount
    }, []);

    const handleLoginSuccess = () => {
        // onAuthStateChanged will handle the state update automatically
    };

    const handleLogout = () => {
        api.logout();
    };

    if (error) {
         return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-lg p-8 bg-red-50 rounded-2xl shadow-lg border border-red-200">
                    <h2 className="text-xl font-bold text-red-800 text-center">Configuration Error</h2>
                    <p className="mt-4 text-red-700 text-center">{error}</p>
                    <p className="mt-2 text-sm text-slate-600 text-center">You need to create a Firebase project and paste the configuration object into the `firebase.ts` file.</p>
                </div>
            </div>
        );
    }

    if (auth.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner message="Checking authentication..." />
            </div>
        )
    }

    return (
         <div className="min-h-screen bg-sky-100 text-slate-800 antialiased">
            {auth.isAuthenticated ? <App onLogout={handleLogout} assignedBial={auth.assignedBial} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
         </div>
    );
};

export default Auth;