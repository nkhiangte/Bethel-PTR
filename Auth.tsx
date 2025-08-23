import React, { useState, useEffect, useCallback } from 'react';
import App from './App.tsx';
import { GoogleLoginPage } from './components/GoogleLoginPage.tsx';
import { ConfigPage } from './components/ConfigPage.tsx';
import * as googleApi from './googleApi.ts';
import * as api from './api.ts';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import type { User } from './types.ts';

type AuthStatus = 'loading' | 'needsConfig' | 'needsLogin' | 'syncing' | 'loggedIn';

const Auth: React.FC = () => {
    const [status, setStatus] = useState<AuthStatus>('loading');
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const initialize = useCallback(async () => {
        const config = googleApi.getConfig();
        if (!config.apiKey || !config.clientId) {
            setStatus('needsConfig');
            return;
        }

        try {
            await googleApi.initClient();
            const googleUser = googleApi.getCurrentGoogleUser();
            
            if (googleUser) {
                setStatus('syncing');
                await api.initializeApi();
                const user = await api.getOrCreateUser({ 
                    id: googleUser.id, 
                    name: googleUser.name, 
                    email: googleUser.email 
                });
                setCurrentUser(user);
                setStatus('loggedIn');
            } else {
                setStatus('needsLogin');
            }
        } catch (error) {
            console.error("Initialization failed:", error);
            // If init fails, maybe the config is bad.
            // For simplicity, we'll just show login. A better UX might prompt to re-configure.
            setStatus('needsLogin');
        }
    }, []);

    useEffect(() => {
        initialize();
    }, [initialize]);

    const handleConfigSaved = () => {
        setStatus('loading');
        initialize();
    };

    const handleLoginSuccess = async (googleUser: { id: string; name: string; email: string; }) => {
        setStatus('syncing');
        await api.initializeApi();
        const user = await api.getOrCreateUser(googleUser);
        setCurrentUser(user);
        setStatus('loggedIn');
    };

    const handleLogout = () => {
        googleApi.signOut();
        setCurrentUser(null);
        setStatus('needsLogin');
    };

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return <LoadingSpinner message="Initializing..." />;
            case 'needsConfig':
                return <ConfigPage onConfigSaved={handleConfigSaved} />;
            case 'needsLogin':
                return <GoogleLoginPage onLoginSuccess={handleLoginSuccess} />;
            case 'syncing':
                return <LoadingSpinner message="Syncing with Google Drive..." />;
            case 'loggedIn':
                if (currentUser) {
                    return <App onLogout={handleLogout} assignedBial={currentUser.assignedBial} />;
                }
                // Fallback in case state is inconsistent
                setStatus('needsLogin');
                return <LoadingSpinner message="An error occurred. Redirecting..." />;
            default:
                return <div>An unexpected error occurred.</div>;
        }
    };

    return (
        <div className="min-h-screen bg-sky-100 text-slate-800 antialiased">
           <div className="flex items-center justify-center min-h-screen">
                {renderContent()}
           </div>
        </div>
    );
};

export default Auth;
