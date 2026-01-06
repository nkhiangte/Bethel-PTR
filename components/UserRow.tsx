
import React, { useState, useEffect } from 'react';
import type { UserDoc, User } from '../types.ts';
import { auth } from '../firebase.ts';
import * as api from '../api.ts';

interface UserRowProps {
    user: UserDoc;
    currentUser: User;
    upaBials: string[];
    onRoleUpdate: (uid: string, updatedRoles: { isAdmin: boolean, assignedBial: string | null }) => void;
    onUserRemove: (uid: string) => void;
}

const SaveIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
    </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
);

const KeyIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
);

export const UserRow: React.FC<UserRowProps> = ({ user, currentUser, upaBials, onRoleUpdate, onUserRemove }) => {
    const [isAdmin, setIsAdmin] = useState(user.isAdmin);
    const [assignedBial, setAssignedBial] = useState(user.assignedBial || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const isCurrentUser = user.uid === currentUser.uid;

    useEffect(() => {
        // If user is made an admin, clear their assigned bial
        if (isAdmin) {
            setAssignedBial('');
        }
    }, [isAdmin]);

    // Clear messages after a delay
    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, error]);

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const newRoles = {
                isAdmin,
                assignedBial: isAdmin ? null : (assignedBial || null),
            };
            await api.updateUserRoles(user.uid, newRoles);
            onRoleUpdate(user.uid, newRoles);
            setSuccessMessage("Roles saved.");
        } catch (e) {
            setError("Failed to save.");
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user.email) return;

        if (!window.confirm(`User "${user.email}" hnenah hian password siamthatna (Reset Link) thawn i duh em?`)) {
            return;
        }

        setIsResetting(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await auth.sendPasswordResetEmail(user.email);
            setSuccessMessage("Reset email thawn a ni ta.");
        } catch (e: any) {
            setError(e.message || "Failed to send reset email.");
            console.error(e);
        } finally {
            setIsResetting(false);
        }
    };

    const handleRemove = async () => {
        if (isCurrentUser) {
            alert("You cannot remove your own account.");
            return;
        }

        if (!window.confirm(`I chiang maw? User "${user.email}" hi i paih chuan a luhna (access) a tawp nghal ang a, Admin dangin bial an pek hma chu a lut thei tawh lo ang.`)) {
            return;
        }

        setIsDeleting(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await api.deleteUserDocument(user.uid);
            onUserRemove(user.uid);
        } catch (e) {
            setError("Failed to delete.");
            console.error(e);
            setIsDeleting(false);
        }
    };

    const hasChanges = user.isAdmin !== isAdmin || (user.assignedBial || '') !== assignedBial;

    return (
        <tr className="group hover:bg-sky-100 transition-colors duration-150">
            <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900">{user.email}</div>
                <div className="text-xs text-slate-500">{user.displayName}</div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
                <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    disabled={isCurrentUser || isSaving || isDeleting || isResetting}
                    className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 disabled:opacity-50"
                    aria-label={`Set admin status for ${user.email}`}
                />
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                <select
                    value={assignedBial}
                    onChange={(e) => setAssignedBial(e.target.value)}
                    disabled={isAdmin || isSaving || isDeleting || isResetting}
                    className="w-full max-w-xs bg-sky-100 border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-200 disabled:cursor-not-allowed"
                     aria-label={`Assign Upa Bial for ${user.email}`}
                >
                    <option value="">-- Not Assigned --</option>
                    {upaBials.map(bial => (
                        <option key={bial} value={bial}>{bial}</option>
                    ))}
                </select>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                 <div className="flex items-center justify-center gap-2">
                    {error && <span className="text-red-500 text-xs mr-2">{error}</span>}
                    {successMessage && <span className="text-emerald-600 text-xs mr-2 font-semibold">{successMessage}</span>}
                    
                    {/* RESET PASSWORD BUTTON */}
                    <button
                        onClick={handleResetPassword}
                        disabled={isSaving || isDeleting || isResetting || !user.email}
                        className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-3 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all text-sm disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm"
                        title="Reset User Password"
                    >
                        {isResetting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <KeyIcon className="w-4 h-4" />
                        )}
                        <span className="hidden lg:inline">{isResetting ? 'Sending...' : 'Reset PW'}</span>
                    </button>

                    {/* SAVE BUTTON */}
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving || isDeleting || isResetting}
                        className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold px-3 py-2 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all text-sm disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm"
                        title="Save Changes"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <SaveIcon className="w-4 h-4" />
                        )}
                        <span className="hidden lg:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>

                    {/* REMOVE BUTTON - only visible if not current user */}
                    {!isCurrentUser && (
                        <button
                            onClick={handleRemove}
                            disabled={isSaving || isDeleting || isResetting}
                            className="inline-flex items-center justify-center gap-2 bg-rose-600 text-white font-semibold px-3 py-2 rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            title="Remove User Access"
                            aria-label={`Remove user ${user.email}`}
                        >
                            {isDeleting ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <TrashIcon className="w-4 h-4" />
                            )}
                            <span className="hidden lg:inline">{isDeleting ? 'Removing...' : 'Paih rawh'}</span>
                        </button>
                    )}
                    
                    {isCurrentUser && (
                        <span className="text-slate-400 italic text-xs">Amah a ni</span>
                    )}
                 </div>
            </td>
        </tr>
    );
};