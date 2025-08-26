import React, { useState } from 'react';
// Fix: Removed v9 modular import. v8 compat function is called on auth object.
import { auth } from '../firebase';

interface ForgotPasswordPageProps {
    onSwitchToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            // Fix: Use v8 compat sendPasswordResetEmail
            await auth.sendPasswordResetEmail(email);
            setSuccessMessage("Password reset email sent! Please check your inbox.");
        } catch (err: any) {
            setError(err.message || "Failed to send reset email. Please check the address and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-sky-100 p-4">
            <div className="w-full max-w-md bg-sky-50 shadow-2xl rounded-2xl p-8">
                <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">Reset Password</h1>
                <p className="text-slate-600 text-center mb-8">Enter your email to receive a reset link.</p>

                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
                {successMessage && <p className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-center">{successMessage}</p>}

                <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                        <label htmlFor="email-reset" className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <input
                            id="email-reset"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            required
                        />
                    </div>
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md disabled:bg-slate-400">
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-sm text-slate-500 mt-8">
                    Remember your password?{' '}
                    <button onClick={onSwitchToLogin} className="font-semibold text-amber-600 hover:text-amber-700">
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};
