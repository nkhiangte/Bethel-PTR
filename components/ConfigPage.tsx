import React, { useState } from 'react';
import { getFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from '../firebase';

interface ConfigPageProps {
    onConfigSaved: () => void;
    error: string | null;
}

const initialConfig = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
};

export const ConfigPage: React.FC<ConfigPageProps> = ({ onConfigSaved, error }) => {
    const [config, setConfig] = useState(getFirebaseConfig() || initialConfig);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveFirebaseConfig(config);
        onConfigSaved();
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear the current Firebase configuration?')) {
            clearFirebaseConfig();
            setConfig(initialConfig);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-sky-100 p-4">
            <div className="w-full max-w-2xl bg-sky-50 shadow-2xl rounded-2xl p-8">
                <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">Firebase Configuration</h1>
                <p className="text-slate-600 text-center mb-8">
                    Please enter the configuration details from your Firebase project settings.
                </p>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                        <p className="font-bold">Configuration Error</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700">API Key</label>
                            <input id="apiKey" name="apiKey" type="text" value={config.apiKey} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-sky-100 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" required />
                        </div>
                        <div>
                            <label htmlFor="authDomain" className="block text-sm font-medium text-slate-700">Auth Domain</label>
                            <input id="authDomain" name="authDomain" type="text" value={config.authDomain} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-sky-100 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" required />
                        </div>
                        <div>
                            <label htmlFor="projectId" className="block text-sm font-medium text-slate-700">Project ID</label>
                            <input id="projectId" name="projectId" type="text" value={config.projectId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-sky-100 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" required />
                        </div>
                        <div>
                            <label htmlFor="storageBucket" className="block text-sm font-medium text-slate-700">Storage Bucket</label>
                            <input id="storageBucket" name="storageBucket" type="text" value={config.storageBucket} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-sky-100 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" required />
                        </div>
                        <div>
                            <label htmlFor="messagingSenderId" className="block text-sm font-medium text-slate-700">Messaging Sender ID</label>
                            <input id="messagingSenderId" name="messagingSenderId" type="text" value={config.messagingSenderId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-sky-100 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" required />
                        </div>
                        <div>
                            <label htmlFor="appId" className="block text-sm font-medium text-slate-700">App ID</label>
                            <input id="appId" name="appId" type="text" value={config.appId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-sky-100 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" required />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-slate-200 text-slate-800 font-semibold px-6 py-3 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all"
                        >
                            Clear
                        </button>
                        <button
                            type="submit"
                            className="bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md"
                        >
                            Save and Initialize
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};