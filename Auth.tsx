import React, { useState, useEffect } from 'react';
import App from './App.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import * as api from './api.ts';

const Auth: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => api.checkAuth());
    const [storageError, setStorageError] = useState<string | null>(null);

    useEffect(() => {
        try {
            localStorage.setItem('__test', 'test');
            localStorage.removeItem('__test');
        } catch (e) {
            setStorageError('Your browser does not support or has disabled local storage, which is required for this app to function. Please enable it or use a different browser.');
        }
    }, []);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        api.logout();
        setIsAuthenticated(false);
    };

    if (storageError) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-md p-8 bg-red-50 rounded-2xl shadow-lg border border-red-200">
                    <h2 className="text-xl font-bold text-red-800 text-center">Unsupported Browser</h2>
                    <p className="mt-4 text-red-700 text-center">{storageError}</p>
                </div>
            </div>
        );
    }

    return (
         <div className="min-h-screen bg-sky-100 text-slate-800 antialiased">
            {isAuthenticated ? <App onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
         </div>
    );
};

export default Auth;
