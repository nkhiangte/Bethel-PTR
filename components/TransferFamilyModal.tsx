

import React, { useState, useEffect } from 'react';
import type { FamilyWithTithe } from '../types.ts';

interface TransferFamilyModalProps {
    family: FamilyWithTithe;
    upaBials: string[];
    currentBial: string;
    onClose: () => void;
    onTransfer: (familyId: string, destinationBial: string) => void;
    isYearLocked: boolean; // New prop
}

export const TransferFamilyModal: React.FC<TransferFamilyModalProps> = ({ family, upaBials, currentBial, onClose, onTransfer, isYearLocked }) => {
    const [destinationBial, setDestinationBial] = useState('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isYearLocked) return; // Prevent submission if locked
        if (destinationBial) {
            onTransfer(family.id, destinationBial);
        }
    };
    
    const availableBials = upaBials.filter(b => b !== currentBial);

    return (
        <div 
            className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center"
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="bg-sky-50 rounded-2xl shadow-2xl w-full max-w-md m-4 p-8 transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Transfer Family</h2>
                        <p className="text-amber-600 font-semibold">{family.name}</p>
                        {isYearLocked && (
                            <p className="mt-2 text-sm text-amber-700">
                                <span className="font-semibold">Note:</span> Family transfers are locked for past years.
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="destinationBial" className="block text-sm font-medium text-slate-700 mb-2">
                            Transfer to Upa Bial
                        </label>
                        <select
                            id="destinationBial"
                            value={destinationBial}
                            onChange={(e) => setDestinationBial(e.target.value)}
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-slate-200 disabled:cursor-not-allowed"
                            required
                            disabled={isYearLocked} // Disable select
                        >
                            <option value="" disabled>-- Select a destination --</option>
                            {availableBials.map(bial => (
                                <option key={bial} value={bial}>{bial}</option>
                            ))}
                        </select>
                         <p className="mt-2 text-xs text-slate-500">
                            This will update the family's *current* Upa Bial assignment. Their historical contribution records will retain the Upa Bial they belonged to at the time of contribution.
                        </p>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto bg-sky-100 text-slate-700 font-semibold px-6 py-3 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!destinationBial || isYearLocked} // Disable submit button
                            className="w-full sm:w-auto bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            Transfer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};