
import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api.ts';
import type { BialInfo, BialVawngtu } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';

// --- ICONS ---
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

const AddIcon: React.FC<{className?: string}> = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
);

const LockIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
);

const UnlockIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
    </svg>
);

const UserMinusIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
       <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm6 11h-8v-2h8v2zm-6-5c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
);


// --- BIAL ROW COMPONENT (Internal) ---
interface InternalBialRowProps {
    bialName: string;
    bialInfo: BialInfo | undefined;
    onVawngtuSave: (bialName: string, newInfo: BialInfo) => Promise<void>;
    onDeleteBial: (bialName: string) => void;
    onClearFamilies: (bialName: string) => Promise<void>;
    isLocked: boolean; // New prop for locking
}

const InternalBialRow: React.FC<InternalBialRowProps> = ({ bialName, bialInfo, onVawngtuSave, onDeleteBial, onClearFamilies, isLocked }) => {
    const [vawngtuList, setVawngtuList] = useState<BialVawngtu[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setVawngtuList(JSON.parse(JSON.stringify(bialInfo?.vawngtu || [])));
    }, [bialInfo]);
    
    const handleAddVawngtu = () => setVawngtuList([...vawngtuList, { name: '', phone: '' }]);
    
    const handleRemoveVawngtu = (index: number) => setVawngtuList(vawngtuList.filter((_, i) => i !== index));
    
    const handleClearVawngtus = () => {
        if (vawngtuList.length === 0) return;
        if (window.confirm(`Are you sure you want to remove ALL Vawngtus from ${bialName}?`)) {
            setVawngtuList([]);
        }
    };

    const handleVawngtuChange = (index: number, field: keyof BialVawngtu, value: string) => {
        const newList = [...vawngtuList];
        newList[index] = { ...newList[index], [field]: value };
        setVawngtuList(newList);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            const cleanedList = vawngtuList
                .map(v => ({ name: v.name.trim(), phone: v.phone.trim() }))
                .filter(v => v.name);
            await onVawngtuSave(bialName, { vawngtu: cleanedList });
        } catch (e) {
            setError('Failed to save.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearFamiliesClick = async () => {
        if (isLocked) return;
        if (!window.confirm(`WARNING: Are you sure you want to delete ALL families assigned to "${bialName}"? \n\nThis will:\n1. Unassign all families currently in this Bial.\n2. DELETE all tithe logs for this Bial in the selected year.\n\nThis action cannot be undone.`)) {
            return;
        }

        setIsClearing(true);
        setError('');
        try {
            await onClearFamilies(bialName);
            alert(`Families cleared from ${bialName}.`);
        } catch (e: any) {
             setError(e.message || 'Failed to clear families.');
        } finally {
            setIsClearing(false);
        }
    };
    
    const hasChanges = JSON.stringify(vawngtuList) !== JSON.stringify(bialInfo?.vawngtu || []);

    return (
        <tr className="group hover:bg-sky-100 transition-colors duration-150">
            <td className="px-4 py-3 whitespace-nowrap align-top">
                <div className="text-sm font-medium text-slate-900 pt-2">{bialName}</div>
            </td>
            <td className="px-4 py-3 align-top">
                <div className="space-y-2">
                    {vawngtuList.map((vawngtu, index) => (
                         <div key={index} className="flex items-center gap-2">
                            <input type="text" value={vawngtu.name} onChange={(e) => handleVawngtuChange(index, 'name', e.target.value)} placeholder="Hming" className="w-full bg-sky-100 border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-amber-500 disabled:bg-slate-200 disabled:cursor-not-allowed" disabled={isLocked}/>
                            <input type="text" value={vawngtu.phone} onChange={(e) => handleVawngtuChange(index, 'phone', e.target.value)} placeholder="Phone" className="w-full bg-sky-100 border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-amber-500 disabled:bg-slate-200 disabled:cursor-not-allowed" disabled={isLocked}/>
                            <button onClick={() => handleRemoveVawngtu(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed" title="Remove Vawngtu" disabled={isLocked}><TrashIcon className="w-5 h-5" /></button>
                         </div>
                    ))}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                        <button onClick={handleAddVawngtu} className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 px-3 py-1 rounded-md hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLocked}>
                            <AddIcon className="w-4 h-4" /> Add Vawngtu
                        </button>
                        {vawngtuList.length > 0 && (
                            <button 
                                onClick={handleClearVawngtus} 
                                className="flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-800 px-3 py-1 rounded-md hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed" 
                                disabled={isLocked}
                                title="Remove all Vawngtus from this list"
                            >
                                <TrashIcon className="w-4 h-4" /> Clear All
                            </button>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-center text-sm font-medium align-top">
                 <div className="flex flex-col items-center gap-2">
                    {error && <span className="text-red-500 text-xs mb-1">{error}</span>}
                    
                    <button onClick={handleSave} disabled={isLocked || !hasChanges || isSaving} className="w-32 inline-flex items-center justify-center gap-2 bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SaveIcon className="w-4 h-4" />}
                        <span>{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>

                     <button onClick={handleClearFamiliesClick} disabled={isLocked || isClearing} className="w-32 inline-flex items-center justify-center gap-2 bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed" title="Delete all families and tithe logs for this Bial">
                        {isClearing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <UserMinusIcon className="w-4 h-4" />}
                        <span>{isClearing ? 'Clearing...' : 'Clear Fams'}</span>
                    </button>

                    <button onClick={() => onDeleteBial(bialName)} className="w-32 inline-flex items-center justify-center gap-2 bg-rose-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLocked}>
                        <TrashIcon className="w-4 h-4" />
                        <span>Delete Bial</span>
                    </button>
                 </div>
            </td>
        </tr>
    );
};

// --- MAIN COMPONENT ---
interface UpaBialSettingsProps {
    onBack: () => void;
    onGoToDashboard: () => void;
    currentYear: number;
    years: number[];
}

export const UpaBialSettings: React.FC<UpaBialSettingsProps> = ({ onBack, onGoToDashboard, currentYear, years }) => {
    const [managementYear, setManagementYear] = useState(currentYear);
    const [upaBials, setUpaBials] = useState<string[]>([]);
    const [allBialInfo, setAllBialInfo] = useState<Map<string, BialInfo>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newBialName, setNewBialName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // New state for year archive status for ALL years
    const [archivedYearsStatus, setArchivedYearsStatus] = useState<Map<number, boolean>>(new Map());

    // Combined lock for the currently selected management year
    const isYearExplicitlyArchived = archivedYearsStatus.get(managementYear) || false;
    const isYearChronologicallyLocked = managementYear < currentYear;
    const isModificationLocked = isYearChronologicallyLocked || isYearExplicitlyArchived;

    const fetchData = useCallback(async (year: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const [bials, infoMap] = await Promise.all([api.fetchUpaBials(year), api.fetchAllBialInfo(year)]);
            setUpaBials(bials);
            setAllBialInfo(infoMap);
            
            // Fetch archive status for all years
            const newArchivedStatuses = new Map<number, boolean>();
            for (const y of years) {
                newArchivedStatuses.set(y, await api.fetchArchiveStatus(y));
            }
            setArchivedYearsStatus(newArchivedStatuses);

        } catch (e: any) {
            setError(`Failed to fetch Bial data for ${year}.`);
        } finally {
            setIsLoading(false);
        }
    }, [years]);

    useEffect(() => {
        fetchData(managementYear);
    }, [managementYear, fetchData]);

    const handleAddBial = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newBialName.trim();
        if (!trimmedName) return;
        if (upaBials.some(b => b.toLowerCase() === trimmedName.toLowerCase())) {
            alert(`"${trimmedName}" already exists for ${managementYear}.`);
            return;
        }
        if (isModificationLocked) {
             setError(`Cannot add new Bial: Year ${managementYear} is locked.`);
             return;
        }

        setIsAdding(true);
        try {
            const newList = [...upaBials, trimmedName].sort((a,b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            await api.updateUpaBialsList(managementYear, newList);
            setUpaBials(newList);
            setNewBialName('');
        } catch (err) {
            setError("Failed to add new Bial.");
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleDeleteBial = async (bialToDelete: string) => {
        if (isModificationLocked) {
            alert(`Cannot delete "${bialToDelete}": Year ${managementYear} is locked.`);
            return;
        }

        setIsLoading(true);
        const inUse = await api.isBialInUse(managementYear, bialToDelete);
        if (inUse) {
            alert(`Cannot delete "${bialToDelete}" for ${managementYear}. It has associated contribution logs. Please reassign contributions before deleting.`);
            setIsLoading(false);
            return;
        }

        if (!window.confirm(`Are you sure you want to permanently delete "${bialToDelete}" for ${managementYear}? This action cannot be undone.`)) {
            setIsLoading(false);
            return;
        }

        try {
            const newList = upaBials.filter(b => b !== bialToDelete);
            await Promise.all([
                api.updateUpaBialsList(managementYear, newList), 
                api.deleteBialInfo(managementYear, bialToDelete)
            ]);
            await fetchData(managementYear); // Refresh all data
        } catch(err) {
            setError("Failed to delete Bial.");
            setIsLoading(false);
        }
    };

    const handleClearFamilies = async (bialName: string) => {
         await api.removeAllFamiliesFromBial(managementYear, bialName);
    };

    const handleVawngtuSave = useCallback(async (bialName: string, newInfo: BialInfo) => {
        if (isModificationLocked) {
            setError(`Cannot save Vawngtu info: Year ${managementYear} is locked.`);
            return;
        }
        await api.updateBialInfo(managementYear, bialName, newInfo);
        setAllBialInfo(prevMap => new Map(prevMap).set(bialName, newInfo));
    }, [managementYear, isModificationLocked]);

    const handleToggleArchiveYear = useCallback(async (yearToArchive: number, isCurrentlyArchived: boolean) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.updateArchiveStatus(yearToArchive, !isCurrentlyArchived);
            setArchivedYearsStatus(prevMap => {
                const newMap = new Map(prevMap);
                newMap.set(yearToArchive, !isCurrentlyArchived);
                return newMap;
            });
            alert(`Year ${yearToArchive} has been ${!isCurrentlyArchived ? 'archived' : 'unarchived'}.`);
        } catch (e: any) {
            setError(`Failed to update archive status for year ${yearToArchive}. ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Upa Bial Settings</h2>
                    <p className="text-slate-600">Add, remove, and manage Upa Bials and their overseers for a specific year.</p>
                </div>
                 <div className="flex flex-wrap gap-4">
                     <button onClick={onGoToDashboard} className="flex items-center gap-2 bg-slate-200 text-slate-800 font-semibold px-4 py-3 rounded-lg hover:bg-slate-300"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg><span>Dashboard</span></button>
                    <button onClick={onBack} className="bg-slate-200 text-slate-800 font-semibold px-6 py-3 rounded-lg hover:bg-slate-300">&larr; Back</button>
                 </div>
            </div>

            <div className="mb-6 p-4 bg-sky-200/50 border border-sky-200 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-3">
                    <label htmlFor="year-select-management" className="block text-sm font-semibold text-slate-700">
                        Select Year to Manage:
                    </label>
                    <select 
                        id="year-select-management"
                        value={managementYear}
                        onChange={(e) => setManagementYear(parseInt(e.target.value, 10))}
                        className="w-full max-w-xs px-4 py-3 text-base text-slate-700 bg-sky-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        disabled={isLoading}
                    >
                        {years.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
                {isModificationLocked && (
                    <p className="mt-2 text-sm text-amber-700 font-semibold">
                        <span className="font-bold">Note:</span> Data for {managementYear} is {isYearChronologicallyLocked ? 'archived (past year)' : 'explicitly archived'} and cannot be modified.
                    </p>
                )}
            </div>

            {isLoading ? <LoadingSpinner message={`Loading settings for ${managementYear}...`} /> :
            <>
                {error && <div className="text-center p-4 mb-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

                {/* Archive Status Management */}
                <div className="mb-8 p-6 bg-purple-100 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-3">Archive Year Status</h3>
                    <p className="text-slate-600 mb-4">
                        Archiving a year makes all its contribution data (tithes, family assignments to bials, and bial overseers) immutable.
                        Past years ({currentYear - 1} and older) are automatically archived.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {years.map(year => {
                            const isYearPast = year < currentYear;
                            const isExplicitlyArchived = archivedYearsStatus.get(year) || false;
                            const displayStatus = isYearPast ? 'Archived (Past Year)' : (isExplicitlyArchived ? 'Archived' : 'Active');
                            const buttonDisabled = isLoading || isYearPast; // Only allow archiving/unarchiving for current/future years

                            return (
                                <div key={year} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm border border-slate-200">
                                    <span className="font-semibold text-slate-800">{year}: {displayStatus}</span>
                                    {!isYearPast && (
                                        <button
                                            onClick={() => handleToggleArchiveYear(year, isExplicitlyArchived)}
                                            disabled={buttonDisabled}
                                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                                isExplicitlyArchived 
                                                ? 'bg-rose-500 text-white hover:bg-rose-600' 
                                                : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                            }`}
                                        >
                                            {isLoading && year === managementYear ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : isExplicitlyArchived ? (
                                                <> <UnlockIcon className="w-4 h-4" /> <span>Unarchive</span> </>
                                            ) : (
                                                <> <LockIcon className="w-4 h-4" /> <span>Archive</span> </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-8 p-6 bg-sky-100 rounded-lg border border-sky-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-3">Add New Upa Bial for {managementYear}</h3>
                    <form onSubmit={handleAddBial} className="flex flex-col sm:flex-row gap-4">
                        <input type="text" value={newBialName} onChange={(e) => setNewBialName(e.target.value)} placeholder="e.g., Upa Bial 14" className="flex-grow w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 disabled:bg-slate-200 disabled:cursor-not-allowed" required disabled={isModificationLocked} />
                        <button type="submit" disabled={isModificationLocked || isAdding} className="bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-amber-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                            {isAdding ? 'Adding...' : 'Add Bial'}
                        </button>
                    </form>
                </div>

                <div className="bg-sky-50 rounded-lg shadow-md overflow-hidden border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-sky-100">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-1/4">Upa Bial ({managementYear})</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-1/2">Bial Vawngtu (Hming leh Phone)</th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-1/4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-sky-50 divide-y divide-slate-200">
                                {upaBials.length > 0 ? upaBials.map(bial => (
                                    <InternalBialRow 
                                        key={bial}
                                        bialName={bial}
                                        bialInfo={allBialInfo.get(bial)}
                                        onVawngtuSave={handleVawngtuSave}
                                        onDeleteBial={handleDeleteBial}
                                        onClearFamilies={handleClearFamilies}
                                        isLocked={isModificationLocked}
                                    />
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="text-center p-6 text-slate-500">No Upa Bials configured for {managementYear}.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>}
        </div>
    );
};
