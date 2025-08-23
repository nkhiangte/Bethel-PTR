import React, { useState, useEffect } from 'react';
import * as googleApi from '../googleApi.ts';

interface ConfigPageProps {
    onConfigSaved: () => void;
    error?: string | null;
}

export const ConfigPage: React.FC<ConfigPageProps> = ({ onConfigSaved, error: initialError }) => {
    const [apiKey, setApiKey] = useState(googleApi.getConfig().apiKey);
    const [clientId, setClientId] = useState(googleApi.getConfig().clientId);
    const [localError, setLocalError] = useState('');
    
    useEffect(() => {
        if (initialError) {
            setLocalError(initialError);
        }
    }, [initialError]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        if (!apiKey.trim() || !clientId.trim()) {
            setLocalError('Both API Key and Client ID are required.');
            return;
        }
        googleApi.saveConfig({ apiKey, clientId });
        onConfigSaved();
    };

    const errorToShow = initialError || localError;
    const origin = window.location.origin;

    return (
        <div className="w-full max-w-3xl p-8 space-y-6 bg-sky-50 rounded-2xl shadow-lg border border-slate-200">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900">One-Time Application Setup</h1>
                <p className="mt-2 text-slate-600">
                    To connect to Google Drive, you must generate credentials.
                </p>
            </div>
            
            <div className="text-sm p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-bold text-red-800">
                    <span className="text-lg mr-2">⚠️</span>STOP! If you are seeing an "Access blocked" or "Error 400" message, it means a step was missed below. Please **delete your old credentials** in Google Cloud and follow this new guide carefully.
                </p>
            </div>

            <div className="text-center p-4 bg-sky-100 border border-sky-300 rounded-lg">
                <p className="font-semibold text-slate-800">Your application's URL for setup is:</p>
                <code className="block mt-2 text-lg font-mono bg-slate-200 text-amber-700 p-2 rounded select-all">{origin}</code>
                <p className="mt-2 text-xs text-slate-500">Copy this exact value to use in the steps below.</p>
            </div>

            <div className="text-sm p-4 bg-sky-100 border border-sky-200 rounded-lg space-y-4">
                <h2 className="font-bold text-slate-800 text-base">Instructions Checklist:</h2>
                
                <ol className="list-decimal list-inside space-y-3 text-slate-700">
                    <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-medium">Google Cloud Console Credentials Page</a> and select your project.</li>
                    
                    <li>
                        <strong>Enable the API:</strong> In the top search bar, find and **Enable** the "Google Drive API".
                    </li>

                    <li>
                        <strong>Configure Consent Screen (Critical Step):</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-2 pl-2">
                             <li>Go to the <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-medium">OAuth consent screen</a> page.</li>
                             <li>User Type: <strong>External</strong>.</li>
                             <li>Fill in the required app name and email fields.</li>
                             <li>Scopes: Click "Add or Remove Scopes", find and check `.../auth/drive.appdata`, then click "Update".</li>
                             <li className="font-bold text-red-700 bg-red-100 p-2 rounded-md">
                                <span className="text-lg mr-2">⚠️</span><strong>Test Users:</strong> Click "+ ADD USERS" and add the Google email address you will use to log in. **If you skip this step, Google will block you.**
                             </li>
                         </ul>
                    </li>

                    <li>
                        <strong>Create OAuth Client ID:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-2 pl-2">
                            <li>Go back to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-medium">Credentials</a> page.</li>
                            <li>Click "+ CREATE CREDENTIALS" &rarr; <strong>OAuth client ID</strong>.</li>
                            <li>Application type: <strong>Web application</strong>.</li>
                             <li className="font-semibold text-amber-800 bg-amber-100 p-2 rounded-md">
                                <span className="text-lg mr-2">⚠️</span>Under "Authorized JavaScript origins", click "ADD URI" and paste the URL from the blue box above (`{origin}`).
                             </li>
                             <li className="font-semibold text-amber-800 bg-amber-100 p-2 rounded-md">
                                <span className="text-lg mr-2">⚠️</span>Under "Authorized redirect URIs", click "ADD URI" and paste the **exact same URL again** (`{origin}`).
                             </li>
                             <li>Click "Create". Copy the <strong>Client ID</strong> and paste it into the form below.</li>
                        </ul>
                    </li>
                     <li>
                        <strong>Create API Key:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 pl-2">
                            <li>Click "+ CREATE CREDENTIALS" &rarr; <strong>API key</strong>.</li>
                            <li>Copy the key that appears and paste it into the form below.</li>
                        </ul>
                    </li>
                </ol>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                {errorToShow && <p className="text-center text-sm text-red-600 bg-red-100 p-3 rounded-md">{errorToShow}</p>}
                <div>
                    <label htmlFor="api-key" className="block text-sm font-medium text-slate-700">Google API Key</label>
                    <input
                        id="api-key"
                        type="password"
                        required
                        className="mt-1 block w-full px-3 py-3 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-sky-100"
                        placeholder="Paste your API Key here"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="client-id" className="block text-sm font-medium text-slate-700">Google Client ID</label>
                    <input
                        id="client-id"
                        type="password"
                        required
                        className="mt-1 block w-full px-3 py-3 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-sky-100"
                        placeholder="Paste your Client ID here"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                    />
                </div>
                <div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                    >
                        Save and Continue
                    </button>
                </div>
            </form>
        </div>
    );
};
