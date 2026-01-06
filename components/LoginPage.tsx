


import React, { useState } from 'react';
// Fix: Removed v9 modular imports. v8 compat functions are called on auth object.
import { auth } from '../firebase.ts';

interface LoginPageProps {
    onSwitchToRegister: () => void;
    onSwitchToForgotPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister, onSwitchToForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            // Fix: Use v8 compat signInWithEmailAndPassword
            await auth.signInWithEmailAndPassword(email, password);
        } catch (err: any) {
            setError(err.message || "Failed to log in. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-sky-100 p-4">
            <div className="w-full max-w-md bg-sky-50 shadow-2xl rounded-2xl p-8">
                <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">Welcome Back</h1>
                <p className="text-slate-600 text-center mb-8">Please sign in to continue.</p>

                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            required
                        />
                    </div>
                    <div className="text-right">
                        <button type="button" onClick={onSwitchToForgotPassword} className="text-sm font-medium text-amber-600 hover:text-amber-700">
                            Forgot Password?
                        </button>
                    </div>
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md disabled:bg-slate-400">
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-sm text-slate-500 mt-8">
                    Don't have an account?{' '}
                    <button onClick={onSwitchToRegister} className="font-semibold text-amber-600 hover:text-amber-700">
                        Register here
                    </button>
                </p>
            </div>
        </div>
    );
};