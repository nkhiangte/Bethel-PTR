import React, { useState, useEffect } from 'react';
import * as api from '../api.ts';
import type { UserDoc, User } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { UserRow } from './UserRow.tsx';

interface UserManagementProps {
    currentUser: User;
    upaBials: string[];
    onBack: () => void;
    onGoToDashboard: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser, upaBials, onBack, onGoToDashboard }) => {
    const [users, setUsers] = useState<UserDoc[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadUsers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedUsers = await api.fetchAllUsers();
                setUsers(fetchedUsers);
            } catch (e: any) {
                setError("Failed to fetch users. You may not have the required permissions.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadUsers();
    }, []);

    const handleRoleUpdate = (uid: string, updatedRoles: { isAdmin: boolean, assignedBial: string | null }) => {
        setUsers(currentUsers => currentUsers.map(u => 
            u.uid === uid ? { ...u, ...updatedRoles } : u
        ));
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading User Data..." />;
    }

    if (error) {
        return <div className="text-center p-8 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
                    <p className="text-slate-600">Assign roles and permissions to application users.</p>
                </div>
                 <div className="flex flex-wrap gap-4">
                     <button
                        onClick={onGoToDashboard}
                        className="flex items-center gap-2 bg-slate-200 text-slate-800 font-semibold px-4 py-3 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={onBack}
                        className="bg-slate-200 text-slate-800 font-semibold px-6 py-3 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all"
                    >
                        &larr; Back
                    </button>
                 </div>
            </div>

            <div className="bg-sky-50 rounded-lg shadow-md overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-sky-100">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    User Email
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Is Admin?
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Assigned Upa Bial
                                </th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                         <tbody className="bg-sky-50 divide-y divide-slate-200">
                            {users.map(user => (
                                <UserRow 
                                    key={user.uid}
                                    user={user}
                                    currentUser={currentUser}
                                    upaBials={upaBials}
                                    onRoleUpdate={handleRoleUpdate}
                                />
                            ))}
                         </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
