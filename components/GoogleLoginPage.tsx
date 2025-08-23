import React, { useState, useEffect } from 'react';
import * as googleApi from '../googleApi.ts';

interface GoogleLoginPageProps {
    onLoginSuccess: (user: { id: string; name: string; email: string; }) => void;
}

const GoogleLogo: React.FC = () => (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6 mr-3">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);

export const GoogleLoginPage: React.FC<GoogleLoginPageProps> = ({ onLoginSuccess }) => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        setError('');
        setIsLoading(true);
        try {
            await googleApi.signIn(onLoginSuccess);
            // onLoginSuccess is called by the callback in signIn
        } catch (err: any) {
            setError(err.message || 'Failed to sign in. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-8 bg-sky-50 rounded-2xl shadow-lg border border-slate-200">
            <div className="text-center">
                 <img
                    src="https://mizoramsynod.org/storage/photo/sBy7mWkYSqSQXfitakOsxKhJ08SoyKifJfOa0db8.jpg"
                    alt="Mizoram Synod Logo"
                    className="mx-auto mb-6 h-20 w-auto"
                />
                <h1 className="text-3xl font-bold text-slate-900">Champhai Bethel Kohhran Thawhlawm</h1>
                <p className="mt-2 text-slate-600">Please sign in with Google to continue</p>
            </div>
            <div className="mt-8">
                {error && <p className="mb-4 text-center text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                
                <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center py-3 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-slate-700 font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        'Signing in...'
                    ) : (
                        <>
                            <GoogleLogo />
                            Sign in with Google
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
