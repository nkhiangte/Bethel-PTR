import React, { useState } from 'react';
import * as googleApi from '../googleApi.ts';

interface ConfigPageProps {
    onConfigSaved: () => void;
}

export const ConfigPage: React.FC<ConfigPageProps> = ({ onConfigSaved }) => {
    const [apiKey, setApiKey] = useState('');
    const [clientId, setClientId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!apiKey.trim() || !clientId.trim()) {
            setError('Both API Key and Client ID are required.');
            return;
        }
        googleApi.saveConfig({ apiKey, clientId });
        onConfigSaved();
    };

    return (
        <div className="w-full max-w-xl p-8 space-y-6 bg-sky-50 rounded-2xl shadow-lg border border-slate-200">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900">One-Time Application Setup</h1>
                <p className="mt-2 text-slate-600">
                    This app uses your Google Drive to store its data. To enable this, you need to provide credentials from your Google Cloud project.
                </p>
            </div>
            
            <div className="text-sm p-4 bg-sky-100 border border-sky-200 rounded-lg">
                <h2 className="font-bold text-slate-800 mb-2">Instructions:</h2>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Google Cloud Console</a>.</li>
                    <li>Create a new project (e.g., "Church Tithe App").</li>
                    <li>Go to "APIs & Services" &gt; "Enabled APIs & services", and enable the **Google Drive API**.</li>
                    <li>Go to "APIs & Services" &gt; "Credentials".</li>
                    <li>Click "+ CREATE CREDENTIALS":
                        <ul className="list-disc list-inside ml-4 mt-1">
                            <li>Select **API key** to get your API Key.</li>
                            <li>Select **OAuth client ID**, choose "Web application", and add `http://localhost:5173` (or your app's URL) to "Authorized JavaScript origins" to get your Client ID.</li>
                        </ul>
                    </li>
                    <li>Copy and paste the generated keys below.</li>
                </ol>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                {error && <p className="text-center text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                <div>
                    <label htmlFor="api-key" className="block text-sm font-medium text-slate-700">Google API Key</label>
                    <input
                        id="api-key"
                        type="text"
                        required
                        className="mt-1 block w-full px-3 py-3 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-sky-100"
                        placeholder="Enter your API Key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="client-id" className="block text-sm font-medium text-slate-700">Google Client ID</label>
                    <input
                        id="client-id"
                        type="text"
                        required
                        className="mt-1 block w-full px-3 py-3 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-sky-100"
                        placeholder="Enter your Client ID"
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
