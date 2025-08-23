
import React, { useState } from 'react';
import * as api from '../api.ts';

interface ForgotPasswordPageProps {
    onSwitchToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (email.trim()) {
            setIsLoading(true);
            try {
                await api.requestPasswordReset(email.trim());
                setMessage(`If an account with email ${email.trim()} exists, a password reset link has been sent.`);
                setEmail('');
            } catch (err: any) {
                setError(err.message || 'An error occurred. Please try again.');
            } finally {
                setIsLoading(false);
            }
        } else {
            setError('Please enter your email address.');
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
                    <h2 className="text-3xl font-bold text-slate-900">Forgot Password</h2>
                    <p className="mt-2 text-slate-600">Enter your email to reset your password.</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-center text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                    {message && <p className="text-center text-sm text-green-600 bg-green-100 p-3 rounded-md">{message}</p>}
                    <div>
                         <label htmlFor="email-address-forgot" className="sr-only">Email address</label>
                        <input
                            id="email-address-forgot"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm bg-sky-100"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </div>
                </form>
                 <p className="mt-2 text-center text-sm text-slate-600">
                    Remember your password?{' '}
                    <button type="button" onClick={onSwitchToLogin} className="font-medium text-amber-600 hover:text-amber-500" disabled={isLoading}>
                        Back to Login
                    </button>
                </p>
            </div>
        </div>
    );
};
