


import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { FamilyWithTithe, Tithe } from '../types.ts';

interface TitheModalProps {
    family: FamilyWithTithe;
    onClose: () => void;
    onSave: (familyId: string, newTithe: Tithe) => void;
    isYearLocked: boolean; // New prop
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(value);
};


export const TitheModal: React.FC<TitheModalProps> = ({ family, onClose, onSave, isYearLocked }) => {
    const [tithe, setTithe] = useState<Tithe>({ ...family.tithe });

    const pathianRamRef = useRef<HTMLInputElement>(null);
    const ramtharRef = useRef<HTMLInputElement>(null);
    const tualchhungRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isYearLocked) { // Only focus if not locked
            pathianRamRef.current?.focus();
            pathianRamRef.current?.select();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, isYearLocked]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isYearLocked) return; // Prevent changes if locked
        const { name, value } = e.target;
        setTithe(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isYearLocked) return; // Prevent submission if locked
        onSave(family.id, tithe);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isYearLocked || e.key !== 'Enter') return; // Prevent keydown actions if locked
        
        e.preventDefault();
        const targetId = e.currentTarget.id;

        if (targetId === 'pathianRam') {
            ramtharRef.current?.focus();
            ramtharRef.current?.select();
        } else if (targetId === 'ramthar') {
            tualchhungRef.current?.focus();
            tualchhungRef.current?.select();
        } else if (targetId === 'tualchhung') {
            onSave(family.id, tithe);
        }
    };

    const totalTithe = useMemo(() => {
        return tithe.pathianRam + tithe.ramthar + tithe.tualchhung;
    }, [tithe]);

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
                        <h2 className="text-2xl font-bold text-slate-800">Sawm a Pakhat Chhunluhna</h2>
                        <p className="text-amber-600 font-semibold">{family.name}</p>
                        {isYearLocked && (
                            <p className="mt-2 text-sm text-amber-700">
                                <span className="font-semibold">Note:</span> Contributions for past years are locked and cannot be modified.
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
                        <label htmlFor="pathianRam" className="block text-sm font-medium text-slate-700 mb-2">
                            Pathian Ram
                        </label>
                        <input
                            ref={pathianRamRef}
                            id="pathianRam"
                            name="pathianRam"
                            type="number"
                            value={tithe.pathianRam === 0 ? '' : tithe.pathianRam}
                            onChange={handleInputChange}
                            onKeyDown={handleInputKeyDown}
                            min="0"
                            placeholder="0"
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-black disabled:bg-slate-200 disabled:cursor-not-allowed"
                            disabled={isYearLocked} // Disable input
                        />
                    </div>
                     <div>
                        <label htmlFor="ramthar" className="block text-sm font-medium text-slate-700 mb-2">
                            Ramthar
                        </label>
                        <input
                            ref={ramtharRef}
                            id="ramthar"
                            name="ramthar"
                            type="number"
                            value={tithe.ramthar === 0 ? '' : tithe.ramthar}
                            onChange={handleInputChange}
                            onKeyDown={handleInputKeyDown}
                            min="0"
                            placeholder="0"
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-black disabled:bg-slate-200 disabled:cursor-not-allowed"
                            disabled={isYearLocked} // Disable input
                        />
                    </div>
                     <div>
                        <label htmlFor="tualchhung" className="block text-sm font-medium text-slate-700 mb-2">
                            Tualchhung
                        </label>
                        <input
                            ref={tualchhungRef}
                            id="tualchhung"
                            name="tualchhung"
                            type="number"
                            value={tithe.tualchhung === 0 ? '' : tithe.tualchhung}
                            onChange={handleInputChange}
                            onKeyDown={handleInputKeyDown}
                            min="0"
                            placeholder="0"
                            className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-black disabled:bg-slate-200 disabled:cursor-not-allowed"
                            disabled={isYearLocked} // Disable input
                        />
                    </div>

                    {/* Total Display */}
                    <div className="pt-6 mt-6 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-slate-700">Total</span>
                            <span className="text-xl font-extrabold text-slate-900" aria-live="polite">
                                {formatCurrency(totalTithe)}
                            </span>
                        </div>
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
                            className="w-full sm:w-auto bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
                            disabled={isYearLocked} // Disable button
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};