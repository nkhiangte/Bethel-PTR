
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../api.ts';
import type { Family } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { SearchBar } from './SearchBar.tsx';
import { useDebounce } from '../hooks/useDebounce.ts'; // Assuming a useDebounce hook exists or will be added

// --- Icons ---
const ReportIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    </svg>
);

const TransferIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 16H6v-2h2v2zm4-2h-2v2h2v-2zm4-2h-2v2h2v-2zm-6-2H8v2h2v-2zm-4 0H4v2h2v-2zm12-4h-2v2h2V8zm-4 0h-2v2h2V8zm-4-4H8v2h2V4zM4 20h16v-2H4v2zM6 4v2H4V4h2zm12 10h2v-2h-2v2zm-8-8H8v2h2V4zm4 0h2V4h-2v2zm4 0h2V4h-2v2z"/>
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
        <path d="m14.09 12.41-2.5-2.5.71-.71 1.79 1.8 1.79-1.8.71.71-2.5 2.5zM12 16.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-8c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5z" opacity="0"/>
        <path d="M12.79 13.21 11.29 11.71 9.79 13.21 9.08 12.5 11.29 10.29 13.5 12.5Z"/>
        <path d="M12 7.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5S14.49 7.5 12 7.5zm0 8c-1.93 0-3.5-1.57-3.5-3.5s1.57 3.5 3.5 3.5 3.5 1.57 3.5-3.5-1.57-3.5-3.5-3.5z"/>
    </svg>
);

const UnassignIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15 17h2v-3h1v-2l-1-5H2l-1 5v2h1v3h2v-3h2v3h2v-3h2v3zm-9 0H4v-3h2v3zm4 0H8v-3h2v3zm4 0h-2v-3h2v3zM3 10h11V6H3l1 4z"/>
    </svg>
);

const EditIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
);

const SaveIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
    </svg>
);

const CancelIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
    </svg>
);


interface AllFamiliesManagementProps {
    onBack: () => void;
    onGoToDashboard: () => void;
    upaBials: string[]; // For transfer modal
    currentYear: number; // For viewing family report
    onOpenTransferModal: (family: Family) => void; // Function to open the transfer modal
}

export const AllFamiliesManagement: React.FC<AllFamiliesManagementProps> = ({ 
    onBack, 
    onGoToDashboard, 
    upaBials, 
    currentYear,
    onOpenTransferModal 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [families, setFamilies] = useState<Family[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedName, setEditedName] = useState('');
    const [editedSerial, setEditedSerial] = useState('');

    const [sortBy, setSortBy] = useState<'name' | 'serial' | null>('serial'); // Default sort
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Debounce the search term to avoid excessive API calls
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedFamilies = await api.searchAllFamilies(debouncedSearchTerm);
            setFamilies(fetchedFamilies);
        } catch (e: any) {
            setError('Failed to fetch families. You may not have the required permissions.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSort = (criteria: 'name' | 'serial') => {
        if (sortBy === criteria) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(criteria);
            setSortOrder('asc'); // Default to ascending when changing criteria
        }
    };

    const sortedFamilies = useMemo(() => {
        let currentFamilies = [...families]; // Create a mutable copy

        if (sortBy === 'name') {
            currentFamilies.sort((a, b) => {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
                if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        } else if (sortBy === 'serial') {
            currentFamilies.sort((a, b) => {
                const serialA = a.ipSerialNo ?? Infinity; // Treat null serial numbers as largest
                const serialB = b.ipSerialNo ?? Infinity;

                if (serialA !== serialB) {
                    return sortOrder === 'asc' ? serialA - serialB : serialB - serialA;
                }
                // Tie-breaker: sort by name if serial numbers are the same (or both null)
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
                if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return currentFamilies;
    }, [families, sortBy, sortOrder]);

    const handleViewFamilyReport = (familyId: string, familyName: string) => {
        // This will navigate to the FamilyYearlyReport view in App.tsx
        // You might need to update App.tsx to handle changing the view and passing props appropriately.
        // For now, we'll just log it. A proper implementation would use `setView('familyReport')` in App.tsx
        // along with setting familyForReport state.
        console.log(`Viewing yearly report for ${familyName} (ID: ${familyId}) for year ${currentYear}`);
        // To integrate fully, App.tsx would need a function like onViewFamilyReport to be passed down.
        // For example: onNavigateToFamilyReport({ id: familyId, name: familyName }, currentYear);
        // For now, we'll call onBack and expect the parent to handle it if it supports that.
        // Or, more directly, App.tsx needs to expose a way to set the familyForReport and view states.
        alert(`Functionality to view report for ${familyName} needs to be implemented. (Current Year: ${currentYear})`);
    };

    const handleUnassignFamily = async (familyId: string, familyName: string) => {
        if (window.confirm(`I chiang chiah em, chhungkua "${familyName}" hi Upa Bial atanga hmet chhuak (unassign) i duh takzet em? Hei hian an thawhlawm chhunluh tawhte a rawn paih tel dawn lo, mahse Upa Bial dangah sawn an nih hma chu a lang tawh lo ang.`)) {
            setIsLoading(true);
            setError(null);
            try {
                await api.unassignFamilyFromBial(familyId);
                fetchData(); // Refresh the list
            } catch (e: any) {
                setError(e.message || 'Failed to unassign family.');
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleEditClick = (family: Family) => {
        setEditingId(family.id);
        setEditedName(family.name);
        setEditedSerial(family.ipSerialNo?.toString() ?? '');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditedName('');
        setEditedSerial('');
    };

    const handleSaveEdit = async (familyId: string) => {
        const trimmedName = editedName.trim();
        if (!trimmedName) {
            alert("Name cannot be empty.");
            return;
        }

        const newSerial = editedSerial.trim() === '' ? null : parseInt(editedSerial, 10);
        if (isNaN(newSerial as number) && newSerial !== null) {
            alert("Serial must be a valid number.");
            return;
        }

        setIsLoading(true);
        try {
            await api.updateFamilyDetails(familyId, {
                name: trimmedName,
                ipSerialNo: newSerial
            });
            setEditingId(null);
            fetchData();
        } catch (e: any) {
            setError("Failed to update family details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Manage All Families</h2>
                    <p className="text-slate-600">Search and manage all families across all Upa Bials.</p>
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

            <div className="mb-4">
                <SearchBar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => handleSort('serial')}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                                ${sortBy === 'serial' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
                >
                    Sort by S/N
                    {sortBy === 'serial' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                </button>
                <button
                    onClick={() => handleSort('name')}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                                ${sortBy === 'name' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
                >
                    Sort by Name
                    {sortBy === 'name' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                </button>
            </div>


            {isLoading ? <LoadingSpinner message="Searching families..." /> :
            <>
                {error && <div className="text-center p-4 mb-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                
                {sortedFamilies.length === 0 ? (
                    <div className="text-center p-8 text-slate-500">No families found matching your search.</div>
                ) : (
                    <div className="bg-sky-50 rounded-lg shadow-md overflow-hidden border border-slate-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-sky-100">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">S/N</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Chhungkua</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Current Upa Bial</th>
                                        <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-sky-50 divide-y divide-slate-200">
                                    {sortedFamilies.map(family => (
                                        <tr key={family.id} className="hover:bg-sky-100 transition-colors duration-150">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                                                {editingId === family.id ? (
                                                    <input 
                                                        type="text" 
                                                        value={editedSerial} 
                                                        onChange={(e) => setEditedSerial(e.target.value.replace(/[^0-9]/g, ''))}
                                                        className="w-20 bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-amber-500 outline-none"
                                                        placeholder="N/A"
                                                    />
                                                ) : (
                                                    family.ipSerialNo ?? <span className="text-slate-400 italic">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">
                                                {editingId === family.id ? (
                                                    <input 
                                                        type="text" 
                                                        value={editedName} 
                                                        onChange={(e) => setEditedName(e.target.value)}
                                                        className="w-full max-w-xs bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-amber-500 outline-none"
                                                    />
                                                ) : (
                                                    family.name
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{family.currentBial || <span className="text-slate-400 italic">Not Assigned</span>}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex items-center justify-center gap-2">
                                                    {editingId === family.id ? (
                                                        <>
                                                            <button 
                                                                onClick={() => handleSaveEdit(family.id)} 
                                                                className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" 
                                                                title="Save Changes"
                                                            >
                                                                <SaveIcon className="w-5 h-5" />
                                                            </button>
                                                            <button 
                                                                onClick={handleCancelEdit} 
                                                                className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors" 
                                                                title="Cancel Edit"
                                                            >
                                                                <CancelIcon className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={() => handleViewFamilyReport(family.id, family.name)} 
                                                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors" 
                                                                title="View Yearly Report"
                                                            >
                                                                <ReportIcon className="w-5 h-5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEditClick(family)} 
                                                                className="p-2 text-amber-600 hover:bg-amber-100 rounded-full transition-colors" 
                                                                title="Edit Family Info"
                                                            >
                                                                <EditIcon className="w-5 h-5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => onOpenTransferModal(family)} 
                                                                className="p-2 text-cyan-600 hover:bg-cyan-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                                                title="Transfer Family"
                                                                disabled={!family.currentBial} // Only allow transfer if currently assigned
                                                            >
                                                                <TransferIcon className="w-5 h-5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleUnassignFamily(family.id, family.name)} 
                                                                className="p-2 text-rose-600 hover:bg-rose-100 rounded-full transition-colors" 
                                                                title="Unassign Family from Bial"
                                                                disabled={!family.currentBial} // Only allow unassign if currently assigned
                                                            >
                                                                <UnassignIcon className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </>}
        </div>
    );
};