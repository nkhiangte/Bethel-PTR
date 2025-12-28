import React, { useState, useEffect } from 'react';
import type { BialInfo, BialVawngtu } from '../types.ts';
import * as api from '../api.ts';

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

interface BialRowProps {
    bialName: string;
    bialInfo: BialInfo | undefined;
    onSave: (bialName: string, newInfo: BialInfo) => void;
}

export const BialRow: React.FC<BialRowProps> = ({ bialName, bialInfo, onSave }) => {
    const [vawngtuList, setVawngtuList] = useState<BialVawngtu[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Deep copy to avoid direct mutation of props
        setVawngtuList(JSON.parse(JSON.stringify(bialInfo?.vawngtu || [])));
    }, [bialInfo]);
    
    const handleAddVawngtu = () => {
        setVawngtuList([...vawngtuList, { name: '', phone: '' }]);
    };

    const handleRemoveVawngtu = (index: number) => {
        setVawngtuList(vawngtuList.filter((_, i) => i !== index));
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
                .filter(v => v.name); // Filter out entries with no name

            const newInfo: BialInfo = { vawngtu: cleanedList };
            await api.updateBialInfo(bialName, newInfo);
            onSave(bialName, newInfo);
        } catch (e) {
            setError('Failed to save.');
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Use JSON stringify for a simple deep comparison
    const hasChanges = JSON.stringify(vawngtuList) !== JSON.stringify(bialInfo?.vawngtu || []);

    return (
        <tr className="group hover:bg-sky-100 transition-colors duration-150">
            <td className="px-4 py-3 whitespace-nowrap align-top">
                <div className="text-sm font-medium text-slate-900 pt-2">{bialName}</div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
                <div className="space-y-2">
                    {vawngtuList.length === 0 && (
                        <p className="text-slate-400 italic text-sm px-3 py-2">Bial vawngtu an awm lo.</p>
                    )}
                    {vawngtuList.map((vawngtu, index) => (
                         <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={vawngtu.name}
                                onChange={(e) => handleVawngtuChange(index, 'name', e.target.value)}
                                placeholder="Hming"
                                className="w-full bg-sky-100 border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                aria-label={`Bial Vawngtu name for ${bialName} at index ${index}`}
                            />
                             <input
                                type="text"
                                value={vawngtu.phone}
                                onChange={(e) => handleVawngtuChange(index, 'phone', e.target.value)}
                                placeholder="Phone"
                                className="w-full bg-sky-100 border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                aria-label={`Bial Vawngtu phone for ${bialName} at index ${index}`}
                            />
                            <button 
                                onClick={() => handleRemoveVawngtu(index)}
                                className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                                title="Remove Vawngtu"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                         </div>
                    ))}
                    <button
                        onClick={handleAddVawngtu}
                        className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 px-3 py-1 rounded-md hover:bg-amber-100 transition-colors"
                    >
                       <AddIcon className="w-4 h-4" />
                       Add Vawngtu
                    </button>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium align-top">
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
