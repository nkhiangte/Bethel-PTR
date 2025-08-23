import React, { useState, useEffect } from 'react';
import type { UserDoc, User } from '../types.ts';
import * as api from '../api.ts';

interface UserRowProps {
    user: UserDoc;
    currentUser: User;
    upaBials: string[];
    onRoleUpdate: (uid: string, updatedRoles: { isAdmin: boolean, assignedBial: string | null }) => void;
}

const SaveIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
    </svg>
);

export const UserRow: React.FC<UserRowProps> = ({ user, currentUser, upaBials, onRoleUpdate }) => {
    const [isAdmin, setIsAdmin] = useState(user.isAdmin);
    const [assignedBial, setAssignedBial] = useState(user.assignedBial || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isCurrentUser = user.uid === currentUser.uid;

    useEffect(() => {
        // If user is made an admin, clear their assigned bial
        if (isAdmin) {
            setAssignedBial('');
        }
    }, [isAdmin]);

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const newRoles = {
                isAdmin,
                assignedBial: isAdmin ? null : (assignedBial || null),
            };
            await api.updateUserRoles(user.uid, newRoles);
            onRoleUpdate(user.uid, newRoles);
            // Optionally show a success message that fades out
        } catch (e) {
            setError("Failed to save.");
            console.error(e);
        } finally {
            setIsSaving(false);
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
                    disabled={isCurrentUser || isSaving}
                    className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 disabled:opacity-50"
                    aria-label={`Set admin status for ${user.email}`}
                />
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                <select
                    value={assignedBial}
                    onChange={(e) => setAssignedBial(e.target.value)}
                    disabled={isAdmin || isSaving}
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
                 {error && <span className="text-red-500 text-xs mr-2">{error}</span>}
                 <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="inline-flex items-center justify-center gap-2 bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all text-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                     {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     ) : (
                         <SaveIcon className="w-4 h-4" />
                     )}
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
            </td>
        </tr>
    );
};
