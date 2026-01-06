

import React, { useState, useRef, useEffect } from 'react';
import type { FamilyWithTithe, TitheCategory } from '../types.ts';

interface TitheRowProps {
  family: FamilyWithTithe;
  onTitheChange: (familyId: string, category: TitheCategory, value: number) => void;
  onRemoveFamily: (familyId: string, year: number) => void; // Updated signature
  onUpdateFamilyName: (familyId: string, newName: string) => void;
  onUpdateIpSerialNo: (familyId: string, newSerial: number | null) => void;
  onOpenTitheModal: (family: FamilyWithTithe) => void;
  onOpenTransferModal: (family: FamilyWithTithe) => void;
  onClearTithe: (familyId: string) => void;
  onViewFamilyReport: (family: {id: string, name: string}) => void;
  formatCurrency: (value: number) => string;
  currentYear: number; // New prop
  selectedYear: number; // New prop
}

// Icons
const TrashIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
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

const ResetIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44 .84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
    </svg>
);

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


export const TitheRow: React.FC<TitheRowProps> = ({ 
    family,
    onTitheChange, 
    onRemoveFamily, 
    onUpdateFamilyName,
    onUpdateIpSerialNo,
    onOpenTitheModal,
    onOpenTransferModal,
    onClearTithe,
    onViewFamilyReport,
    formatCurrency,
    currentYear, // Use new prop
    selectedYear // Use new prop
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(family.name);
    const [editedSerial, setEditedSerial] = useState(family.ipSerialNo?.toString() ?? '');

    const nameInputRef = useRef<HTMLInputElement>(null);

    // Disable actions for past years
    const isYearLocked = selectedYear < currentYear;

    useEffect(() => {
        if (isEditing) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [isEditing]);

    const handleEditClick = () => {
        if (isYearLocked) return; // Prevent editing if year is locked
        setIsEditing(true);
    };
    
    const handleCancelClick = () => {
        setIsEditing(false);
        setEditedName(family.name);
        setEditedSerial(family.ipSerialNo?.toString() ?? '');
    };
    
    const handleSaveClick = () => {
        if (isYearLocked) return; // Prevent saving if year is locked

        const newName = editedName.trim();
        const newSerial = editedSerial.trim() === '' ? null : parseInt(editedSerial, 10);
        
        if (newName === '') {
            alert('Chhungkua hming a ruak thei lo.');
            nameInputRef.current?.focus();
            return;
        }

        if (isNaN(newSerial as number) && newSerial !== null) {
            alert('Serial number must be a valid number.');
            return;
        }
        
        if (newName !== family.name) {
            onUpdateFamilyName(family.id, newName);
        }
        if (newSerial !== family.ipSerialNo) {
            onUpdateIpSerialNo(family.id, newSerial);
        }
        setIsEditing(false);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveClick();
        } else if (e.key === 'Escape') {
            handleCancelClick();
        }
    };
    
    const handleDeleteClick = () => {
        if (isYearLocked) return; // Prevent deletion if year is locked

        if (window.confirm(`I chiang chiah em, he chhungkua "${family.name}" hi paih i duh takzet em? He chhungkua hi kum ${selectedYear} atanga Upa Bial hrang hrang atanga tihbo (unassigned) a ni ang a, kum ${selectedYear} chhunga an thawhlawm chhunluh zawng zawng pawh paih vek a ni ang. Amaherawhchu, kum hmasa (hlui) zawng zawngah chuan an thawhlawm chhunluh chu a awm hmunah a awm zel ang.`)) {
            onRemoveFamily(family.id, selectedYear); // Pass selectedYear
        }
    };
    
    const handleClearTitheClick = () => {
        if (isYearLocked) return; // Prevent clearing if year is locked
         if (window.confirm(`Are you sure you want to reset all tithe contributions for "${family.name}" for this month to zero?`)) {
            onClearTithe(family.id);
        }
    };

    const familyTotal = family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung;

    return (
        <tr className="group hover:bg-sky-100 transition-colors duration-150">
            {/* IP Serial No. */}
            <td className="px-2 py-2 sm:px-3 text-sm text-slate-600 whitespace-nowrap">
                {isEditing ? (
                     <input
                        type="text" // Use text to allow empty input
                        value={editedSerial}
                        onChange={(e) => setEditedSerial(e.target.value.replace(/[^0-9]/g, ''))} // Allow only numbers
                        onKeyDown={handleKeyDown}
                        placeholder="N/A"
                        className="w-20 bg-sky-100 border border-amber-400 rounded-md px-2 py-1 focus:ring-2 focus:ring-amber-500 outline-none"
                        disabled={isYearLocked} // Disable input for locked years
                    />
                ) : (
                    family.ipSerialNo ?? <span className="text-slate-400 italic">N/A</span>
                )}
            </td>
            {/* Family Name */}
            <td className="px-2 py-2 sm:px-3 text-base font-medium text-slate-800 whitespace-nowrap">
                {isEditing ? (
                    <input 
                        ref={nameInputRef}
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-sky-100 border border-amber-400 rounded-md px-2 py-1 focus:ring-2 focus:ring-amber-500 outline-none"
                        disabled={isYearLocked} // Disable input for locked years
                    />
                ) : (
                    family.name
                )}
            </td>
            {/* Tithe Amounts */}
            <td 
                className={`px-2 py-2 sm:px-3 text-right text-sm text-slate-700 ${isYearLocked ? '' : 'cursor-pointer'}`} 
                onClick={() => !isYearLocked && onOpenTitheModal(family)} 
                role="button" 
                tabIndex={isYearLocked ? -1 : 0}
                aria-disabled={isYearLocked}
            >
                {formatCurrency(family.tithe.pathianRam)}
            </td>
            <td 
                className={`px-2 py-2 sm:px-3 text-right text-sm text-slate-700 ${isYearLocked ? '' : 'cursor-pointer'}`} 
                onClick={() => !isYearLocked && onOpenTitheModal(family)} 
                role="button" 
                tabIndex={isYearLocked ? -1 : 0}
                aria-disabled={isYearLocked}
            >
                {formatCurrency(family.tithe.ramthar)}
            </td>
            <td 
                className={`px-2 py-2 sm:px-3 text-right text-sm text-slate-700 ${isYearLocked ? '' : 'cursor-pointer'}`} 
                onClick={() => !isYearLocked && onOpenTitheModal(family)} 
                role="button" 
                tabIndex={isYearLocked ? -1 : 0}
                aria-disabled={isYearLocked}
            >
                {formatCurrency(family.tithe.tualchhung)}
            </td>
            {/* Total */}
            <td 
                className={`px-2 py-2 sm:px-3 text-right text-sm font-bold text-slate-900 ${isYearLocked ? '' : 'cursor-pointer'}`} 
                onClick={() => !isYearLocked && onOpenTitheModal(family)} 
                role="button" 
                tabIndex={isYearLocked ? -1 : 0}
                aria-disabled={isYearLocked}
            >
                {formatCurrency(familyTotal)}
            </td>
            {/* Actions */}
            <td className="px-2 py-2 sm:px-3 text-center no-print">
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={handleSaveClick} className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Save Changes" aria-label="Save family changes" disabled={isYearLocked}>
                                <SaveIcon className="w-5 h-5" />
                            </button>
                            <button onClick={handleCancelClick} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Cancel Edit" aria-label="Cancel editing family" disabled={isYearLocked}>
                                <CancelIcon className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <>
                             <button onClick={() => onOpenTransferModal(family)} className="p-2 text-cyan-600 hover:bg-cyan-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Transfer Family" aria-label={`Transfer family ${family.name}`} disabled={isYearLocked}>
                                <TransferIcon className="w-5 h-5" />
                            </button>
                             <button onClick={() => onViewFamilyReport({ id: family.id, name: family.name })} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors" title="View Yearly Report" aria-label={`View yearly report for ${family.name}`}>
                                <ReportIcon className="w-5 h-5" />
                            </button>
                             <button onClick={handleClearTitheClick} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Reset Tithes to Zero" aria-label={`Reset tithes for ${family.name}`} disabled={isYearLocked}>
                                <ResetIcon className="w-5 h-5" />
                            </button>
                            <button onClick={handleEditClick} className="p-2 text-amber-600 hover:bg-amber-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Edit Family Info" aria-label={`Edit info for ${family.name}`} disabled={isYearLocked}>
                                <EditIcon className="w-5 h-5" />
                            </button>
                            <button onClick={handleDeleteClick} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Delete Family" aria-label={`Delete family ${family.name}`} disabled={isYearLocked}>
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};