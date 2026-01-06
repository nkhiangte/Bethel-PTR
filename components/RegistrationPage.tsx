


import React, { useState, useEffect } from 'react';
// Fix: Removed v9 modular import. v8 compat function is called on auth object.
import { auth } from '../firebase.ts';
import * as api from '../api.ts';

interface RegistrationPageProps {
    onSwitchToLogin: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [assignedBial, setAssignedBial] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [upaBialsList, setUpaBialsList] = useState<string[]>([]);
    const [isLoadingBials, setIsLoadingBials] = useState(true);

    useEffect(() => {
        const loadBials = async () => {
            setIsLoadingBials(true);
            try {
                // Fetch bials for the current year for new registrations
                const currentYear = new Date().getFullYear();
                const bials = await api.fetchUpaBials(currentYear);
                setUpaBialsList(bials);
            } catch (err) {
                console.error("Failed to load Upa Bials", err);
                setError("Could not load list of Upa Bials. Please try again later.");
            } finally {
                setIsLoadingBials(false);
            }
        };
        loadBials();
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!firstName.trim()) {
            setError("Hming (Full Name) hman a ngai.");
            return;
        }
        if (!assignedBial) {
            setError("Upa Bial thlan ngei a ngai.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password hi character 6 aia tlem lo a ni tur a ni.");
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
                <p className="text-slate-600 text-center mb-8">Register to start managing tithes.</p>

                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{error}</p>}
                {successMessage && <p className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-center">{successMessage}</p>}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label htmlFor="firstName-register" className="block text-sm font-semibold text-slate-700 mb-1">
                            Hming (Full Name) <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="firstName-register"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="I hming ziak rawh"
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="upa-bial-register" className="block text-sm font-semibold text-slate-700 mb-1">
                            Upa Bial <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="upa-bial-register"
                            value={assignedBial}
                            onChange={(e) => setAssignedBial(e.target.value)}
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            required
                            disabled={isLoadingBials}
                        >
                            <option value="">{isLoadingBials ? 'Loading...' : '-- Select Upa Bial --'}</option>
                            {upaBialsList.map(bial => (
                                <option key={bial} value={bial}>{bial}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="email-register" className="block text-sm font-semibold text-slate-700 mb-1">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="email-register"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@gmail.com"
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="password-register" className="block text-sm font-semibold text-slate-700 mb-1">
                                Password <span className="text-red-500">*</span>
                            </label>
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
                            <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-1">
                                Confirm <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                                required
                            />
                        </div>
                    </div>
                    <div className="pt-4">
                        <button type="submit" disabled={isLoading || isLoadingBials} className="w-full bg-amber-600 text-white font-bold px-6 py-4 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md disabled:bg-slate-400">
                            {isLoading ? 'Registering...' : 'Register Now'}
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