import React, { useState, useEffect } from 'react';
import App from './App.tsx';
import * as api from './api.ts';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';

const Auth: React.FC = () => {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        api.initializeApi();
        setIsInitialized(true);
    }, []);

    const handleResetData = () => {
        if (window.confirm('Are you sure you want to permanently delete all application data from this device? This action cannot be undone.')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="min-h-screen bg-sky-100 text-slate-800 antialiased">
            {!isInitialized ? (
                <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="w-full max-w-md p-8 space-y-8 bg-sky-50 rounded-2xl shadow-lg border border-slate-200">
                        <LoadingSpinner message="Initializing Local Storage..." />
                    </div>
                </div>
            ) : (
                <App onLogout={handleResetData} assignedBial={null} />
            )}
        </div>
    );
};

export default Auth;
