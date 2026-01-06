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


// --- BIAL ROW COMPONENT (Internal) ---
interface InternalBialRowProps {
    bialName: string;
    bialInfo: BialInfo | undefined;
    onVawngtuSave: (bialName: string, newInfo: BialInfo) => Promise<void>;
    onDeleteBial: (bialName: string) => void;
    isLocked: boolean; // New prop for locking
}

const InternalBialRow: React.FC<InternalBialRowProps> = ({ bialName, bialInfo, onVawngtuSave, onDeleteBial, isLocked }) => {
    const [vawngtuList, setVawngtuList] = useState<BialVawngtu[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setVawngtuList(JSON.parse(JSON.stringify(bialInfo?.vawngtu || [])));
    }, [bialInfo]);
    
    const handleAddVawngtu = () => setVawngtuList([...vawngtuList, { name: '', phone: '' }]);
    const handleRemoveVawngtu = (index: number) => setVawngtuList(vawngtuList.filter((_, i) => i !== index));
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
                            <input type="text" value={vawngtu.name} onChange={(e) => handleVawngtuChange(index, 'name', e.target.value)} placeholder="Hming" className="w-full bg-sky-100 border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-amber-500" disabled={isLocked}/>
                            <input type="text" value={vawngtu.phone} onChange={(e) => handleVawngtuChange(index, 'phone', e.target.value)} placeholder="Phone" className="w-full bg-sky-100 border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-amber-500" disabled={isLocked}/>
                            <button onClick={() => handleRemoveVawngtu(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Remove Vawngtu" disabled={isLocked}><TrashIcon className="w-5 h-5" /></button>
                         </div>
                    ))}
                    <button onClick={handleAddVawngtu} className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 px-3 py-1 rounded-md hover:bg-amber-100" disabled={isLocked}><AddIcon className="w-4 h-4" /> Add Vawngtu</button>
                </div>
            </td>
            <td className="px-4 py-3 text-center text-sm font-medium align-top">
                 <div className="flex flex-col items-center gap-2">
                    {error && <span className="text-red-500 text-xs mb-1">{error}</span>}
                    <button onClick={handleSave} disabled={isLocked || !hasChanges || isSaving} className="w-28 inline-flex items-center justify-center gap-2 bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 disabled:bg-slate-400">
                        {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SaveIcon className="w-4 h-4" />}
                        <span>{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button onClick={() => onDeleteBial(bialName)} className="w-28 inline-flex items-center justify-center gap-2 bg-rose-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-rose-700" disabled={isLocked}>
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
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

export const UpaBialSettings: React.FC<UpaBialSettingsProps> = ({ onBack, onGoToDashboard }) => {
    const [managementYear, setManagementYear] = useState(currentYear);
    const [upaBials, setUpaBials] = useState<string[]>([]);
    const [allBialInfo, setAllBialInfo] = useState<Map<string, BialInfo>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newBialName, setNewBialName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const isYearLocked = managementYear < currentYear;

    const fetchData = useCallback(async (year: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const [bials, infoMap] = await Promise.all([api.fetchUpaBials(year), api.fetchAllBialInfo(year)]);
            setUpaBials(bials);
            setAllBialInfo(infoMap);
        } catch (e: any) {
            setError(`Failed to fetch Bial data for ${year}.`);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
    
    const handleVawngtuSave = useCallback(async (bialName: string, newInfo: BialInfo) => {
        await api.updateBialInfo(managementYear, bialName, newInfo);
        setAllBialInfo(prevMap => new Map(prevMap).set(bialName, newInfo));
    }, [managementYear]);

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

            <div className="mb-6">
                <label htmlFor="year-select-management" className="block text-sm font-semibold text-slate-700 mb-1">
                    Select Year to Manage
                </label>
                <select 
                    id="year-select-management"
                    value={managementYear}
                    onChange={(e) => setManagementYear(parseInt(e.target.value, 10))}
                    className="w-full max-w-xs px-4 py-3 text-base text-slate-700 bg-sky-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                    {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                {isYearLocked && (
                    <p className="mt-2 text-sm text-amber-700">
                        <span className="font-semibold">Note:</span> Data for past years is locked and cannot be modified.
                    </p>
                )}
            </div>

            {isLoading ? <LoadingSpinner message={`Loading settings for ${managementYear}...`} /> :
            <>
                {error && <div className="text-center p-4 mb-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

                <div className="mb-8 p-6 bg-sky-100 rounded-lg border border-sky-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-3">Add New Upa Bial for {managementYear}</h3>
                    <form onSubmit={handleAddBial} className="flex flex-col sm:flex-row gap-4">
                        <input type="text" value={newBialName} onChange={(e) => setNewBialName(e.target.value)} placeholder="e.g., Upa Bial 14" className="flex-grow w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500" required disabled={isYearLocked} />
                        <button type="submit" disabled={isYearLocked || isAdding} className="bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-amber-700 disabled:bg-slate-400">
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
                                        isLocked={isYearLocked}
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