import React, { useState } from 'react';
import * as api from '../api.ts';

interface ForgotPasswordPageProps {
    onSwitchToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onSwitchToLogin }) => {
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.trim()) {
            setIsLoading(true);
            try {
                const password = await api.requestPasswordReset(phone.trim());
                if (password) {
                    alert(`Password Recovery (Demonstration Only):\n\nYour password is: ${password}\n\nThis is for demonstration and should NEVER be done in a real application. You can now use this password to log in.`);
                } else {
                    alert('If an account with that phone number exists, password recovery has been initiated. (For this demo, no account was found with that number).');
                }
                onSwitchToLogin();
            } catch (err: any) {
                alert(err.message || 'An error occurred.');
            } finally {
                setIsLoading(false);
            }
        } else {
            alert('Please enter your phone number.');
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
                    <p className="mt-2 text-slate-600">Enter your phone number to reset your password.</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                         <label htmlFor="phone-number-forgot" className="sr-only">Phone Number</label>
                        <input
                            id="phone-number-forgot"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            required
                            className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm bg-sky-100"
                            placeholder="Phone Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
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