import React, { useState } from 'react';
import * as api from '../api.ts';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.login(email.trim(), password.trim());
            onLoginSuccess(); // This is now just a confirmation; Auth.tsx handles the state change
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-sky-50 rounded-2xl shadow-lg border border-slate-200">
                <div className="text-center">
                     <img
                        src="https://mizoramsynod.org/storage/photo/sBy7mWkYSqSQXfitakOsxKhJ08SoyKifJfOa0db8.jpg"
                        alt="Mizoram Synod Logo"
                        className="mx-auto mb-6 h-20 w-auto"
                    />
                    <h1 className="text-3xl font-bold text-slate-900">Champhai Bethel Kohhran Thawhlawm</h1>
                    <p className="mt-2 text-slate-600">Please login to continue</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-center text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-t-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm bg-sky-100"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-b-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm bg-sky-100"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};