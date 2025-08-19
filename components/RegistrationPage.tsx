import React, { useState } from 'react';
import * as api from '../api.ts';

interface RegistrationPageProps {
    onSwitchToLogin: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (name.trim() && phone.trim() && password.trim()) {
            setIsLoading(true);
            try {
                await api.register(name, phone, password);
                alert('Registration successful! Please log in.');
                onSwitchToLogin();
            } catch (err: any) {
                setError(err.message || 'Registration failed. Please try again.');
            } finally {
                setIsLoading(false);
            }
        } else {
             setError('Please fill in all fields.');
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
                    <h2 className="text-3xl font-bold text-slate-900">Create a New Account</h2>
                    <p className="mt-2 text-slate-600">Join us today!</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-center text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="full-name" className="sr-only">Full Name</label>
                            <input
                                id="full-name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-t-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm bg-sky-100"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                         <div>
                            <label htmlFor="phone-number-reg" className="sr-only">Username / Phone</label>
                            <input
                                id="phone-number-reg"
                                name="phone"
                                type="text"
                                autoComplete="username"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm bg-sky-100"
                                placeholder="Username / Phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password-reg" className="sr-only">Password</label>
                            <input
                                id="password-reg"
                                name="password"
                                type="password"
                                autoComplete="new-password"
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
                            {isLoading ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <button type="button" onClick={onSwitchToLogin} className="font-medium text-amber-600 hover:text-amber-500" disabled={isLoading}>
                        Login here
                    </button>
                </p>
            </div>
        </div>
    );
};