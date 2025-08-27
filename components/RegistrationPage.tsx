import React, { useState } from 'react';
// Fix: Removed v9 modular import. v8 compat function is called on auth object.
import { auth } from '../firebase.ts';
import * as api from '../api.ts';

interface RegistrationPageProps {
    onSwitchToLogin: () => void;
}

const UPA_BIALS = Array.from({ length: 13 }, (_, i) => `Upa Bial ${i + 1}`);

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [assignedBial, setAssignedBial] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!firstName.trim()) {
            setError("First Name is required.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            // Fix: Use v8 compat createUserWithEmailAndPassword, which takes 2 arguments.
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            if (userCredential.user) {
                // Update Firebase Auth profile displayName
                await userCredential.user.updateProfile({
                    displayName: firstName.trim()
                });

                // Create Firestore document with extra details
                await api.createUserDocument(userCredential.user, { 
                    displayName: firstName.trim(), 
                    assignedBial: assignedBial || null 
                });
            } else {
                throw new Error("User creation was not successful. Please try again.");
            }

            setSuccessMessage("Registration successful! Please check with your administrator to have your role assigned before logging in.");
        } catch (err: any) {
            let errorMessage = err.message || "Failed to register. Please try again.";
            if (err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission denied'))) {
                errorMessage = "Registration failed due to a permissions issue. Please contact the administrator to ensure the database is configured to allow new user sign-ups.";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-sky-100 p-4">
            <div className="w-full max-w-md bg-sky-50 shadow-2xl rounded-2xl p-8">
                <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">Create Account</h1>
                <p className="text-slate-600 text-center mb-8">Get started with your new account.</p>

                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
                {successMessage && <p className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-center">{successMessage}</p>}

                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label htmlFor="email-register" className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <input
                            id="email-register"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="firstName-register" className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                        <input
                            id="firstName-register"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password-register" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                        <input
                            id="password-register"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                             className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="upa-bial-register" className="block text-sm font-medium text-slate-700 mb-2">Upa Bial (Optional)</label>
                        <select
                            id="upa-bial-register"
                            value={assignedBial}
                            onChange={(e) => setAssignedBial(e.target.value)}
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                        >
                            <option value="">-- Select Upa Bial --</option>
                            {UPA_BIALS.map(bial => (
                                <option key={bial} value={bial}>{bial}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md disabled:bg-slate-400">
                            {isLoading ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-sm text-slate-500 mt-8">
                    Already have an account?{' '}
                    <button onClick={onSwitchToLogin} className="font-semibold text-amber-600 hover:text-amber-700">
                        Sign in here
                    </button>
                </p>
            </div>
        </div>
    );
};