import React, { useState, useEffect } from 'react';
import App from './App.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { RegistrationPage } from './components/RegistrationPage.tsx';
import * as api from './api.ts';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import type { User } from './types.ts';

type AuthView = 'login' | 'register';

interface AuthState {
    isAuthenticated: boolean;
    assignedBial: string | null;
    isLoading: boolean;
}

const Auth: React.FC = () => {
    const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, assignedBial: null, isLoading: true });
    const [view, setView] = useState<AuthView>('login');

    useEffect(() => {
        const checkAuth = async () => {
            const user = await api.getCurrentUser();
            if (user) {
                setAuth({ isAuthenticated: true, assignedBial: user.assignedBial, isLoading: false });
            } else {
                setAuth({ isAuthenticated: false, assignedBial: null, isLoading: false });
            }
        };
        checkAuth();
    }, []);

    const handleLoginSuccess = (user: User) => {
        setAuth({ isAuthenticated: true, assignedBial: user.assignedBial, isLoading: false });
    };

    const handleLogout = () => {
        api.logout();
        setAuth({ isAuthenticated: false, assignedBial: null, isLoading: false });
        setView('login');
    };

    if (auth.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner message="Checking session..." />
            </div>
        )
    }
    
    const renderAuthView = () => {
        switch(view) {
            case 'register':
                return <RegistrationPage onSwitchToLogin={() => setView('login')} />;
            case 'login':
            default:
                return <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setView('register')} />;
        }
    }

    return (
         <div className="min-h-screen bg-sky-100 text-slate-800 antialiased">
            {auth.isAuthenticated ? <App onLogout={handleLogout} assignedBial={auth.assignedBial} /> : renderAuthView()}
         </div>
    );
};

export default Auth;
