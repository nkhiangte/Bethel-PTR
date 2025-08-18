import React, { useState } from 'react';
import App from './App.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { RegistrationPage } from './components/RegistrationPage.tsx';
import { ForgotPasswordPage } from './components/ForgotPasswordPage.tsx';
import * as api from './api.ts';

type AuthView = 'login' | 'register' | 'forgot-password';

const Auth: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => api.checkAuth());
    const [authView, setAuthView] = useState<AuthView>('login');

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        api.logout();
        setIsAuthenticated(false);
        setAuthView('login');
    };

    const renderAuthContent = () => {
        switch (authView) {
            case 'register':
                return <RegistrationPage onSwitchToLogin={() => setAuthView('login')} />;
            case 'forgot-password':
                return <ForgotPasswordPage onSwitchToLogin={() => setAuthView('login')} />;
            case 'login':
            default:
                return (
                    <LoginPage
                        onLoginSuccess={handleLoginSuccess}
                        onSwitchToRegister={() => setAuthView('register')}
                        onSwitchToForgotPassword={() => setAuthView('forgot-password')}
                    />
                );
        }
    };

    return (
         <div className="min-h-screen bg-sky-100 text-slate-800 antialiased">
            {isAuthenticated ? <App onLogout={handleLogout} /> : renderAuthContent()}
         </div>
    );
};

export default Auth;