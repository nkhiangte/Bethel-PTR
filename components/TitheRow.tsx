
import React, { useState, useRef, useEffect } from 'react';
import type { Family, TitheCategory } from '../types.ts';

interface TitheRowProps {
  family: Family;
  onTitheChange: (familyId: string, category: TitheCategory, value: number) => void;
  onRemoveFamily: (familyId: string) => void;
  onUpdateFamilyName: (familyId: string, newName: string) => void;
  onUpdateIpSerialNo: (familyId: string, newSerial: number | null) => void;
  onOpenTitheModal: (family: Family) => void;
  onClearTithe: (familyId: string) => void;
  formatCurrency: (value: number) => string;
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
        <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
    </svg>
);

export const TitheRow: React.FC<TitheRowProps> = ({ 
    family,
    onTitheChange, 
    onRemoveFamily, 
    onUpdateFamilyName,
    onUpdateIpSerialNo,
    onOpenTitheModal,
    onClearTithe,
    formatCurrency 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(family.name);
    const [editedSerial, setEditedSerial] = useState(family.ipSerialNo?.toString() ?? '');

    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [isEditing]);

    const handleEditClick = () => {
        setIsEditing(true);
    };
    
    const handleCancelClick = () => {
        setIsEditing(false);
        setEditedName(family.name);
        setEditedSerial(family.ipSerialNo?.toString() ?? '');
    };
    
    const handleSaveClick = () => {
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
        if (window.confirm(`I chiang chiah em, he chhungkua "${family.name}" hi i paih dawn? Thla zawng zawng atanga paih a ni ang a, siam that leh theih a ni tawh lo ang.`)) {
            onRemoveFamily(family.id);
        }
    };
    
    const handleClearTitheClick = () => {
         if (window.confirm(`Are you sure you want to reset all tithe contributions for "${family.name}" for this month to zero?`)) {
            onClearTithe(family.id);
        }
    };

    const familyTotal = family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung;

    return (
        <tr className="group hover:bg-sky-100 transition-colors duration-150">
            {/* Family Name */}
            <td className="px-2 py-3 sm:px-4 text-sm font-medium text-slate-800 whitespace-nowrap">
                {isEditing ? (
                    <input 
                        ref={nameInputRef}
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-sky-100 border border-amber-400 rounded-md px-2 py-1 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                ) : (
                    family.name
                )}
            </td>
            {/* IP Serial No. */}
            <td className="px-2 py-3 sm:px-4 text-sm text-slate-600 whitespace-nowrap">
                {isEditing ? (
                     <input
                        type="text" // Use text to allow empty input
                        value={editedSerial}
                        onChange={(e) => setEditedSerial(e.target.value.replace(/[^0-9]/g, ''))} // Allow only numbers
                        onKeyDown={handleKeyDown}
                        placeholder="N/A"
                        className="w-20 bg-sky-100 border border-amber-400 rounded-md px-2 py-1 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                ) : (
                    family.ipSerialNo ?? <span className="text-slate-400 italic">N/A</span>
                )}
            </td>
            {/* Tithe Amounts */}
            <td className="px-2 py-3 sm:px-4 text-right text-sm text-slate-700 cursor-pointer" onClick={() => onOpenTitheModal(family)} role="button" tabIndex={0}>
                {formatCurrency(family.tithe.pathianRam)}
            </td>
            <td className="px-2 py-3 sm:px-4 text-right text-sm text-slate-700 cursor-pointer" onClick={() => onOpenTitheModal(family)} role="button" tabIndex={0}>
                {formatCurrency(family.tithe.ramthar)}
            </td>
            <td className="px-2 py-3 sm:px-4 text-right text-sm text-slate-700 cursor-pointer" onClick={() => onOpenTitheModal(family)} role="button" tabIndex={0}>
                {formatCurrency(family.tithe.tualchhung)}
            </td>
            {/* Family Total */}
            <td className="px-2 py-3 sm:px-4 text-right text-sm font-bold text-slate-900 cursor-pointer" onClick={() => onOpenTitheModal(family)} role="button" tabIndex={0}>
                {formatCurrency(familyTotal)}
            </td>
            {/* Actions */}
            <td className="px-2 py-3 sm:px-4 text-center">
                <div className="flex items-center justify-center gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={handleSaveClick} className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Save Changes" aria-label="Save family changes">
                                <SaveIcon className="w-5 h-5" />
                            </button>
                            <button onClick={handleCancelClick} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Cancel Edit" aria-label="Cancel editing family">
                                <CancelIcon className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleClearTitheClick} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Reset Tithes to Zero" aria-label={`Reset tithes for ${family.name}`}>
                                <ResetIcon className="w-5 h-5" />
                            </button>
                            <button onClick={handleEditClick} className="p-2 text-amber-600 hover:bg-amber-100 rounded-full transition-colors" title="Edit Family Info" aria-label={`Edit info for ${family.name}`}>
                                <EditIcon className="w-5 h-5" />
                            </button>
                            <button onClick={handleDeleteClick} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Delete Family" aria-label={`Delete family ${family.name}`}>
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};
