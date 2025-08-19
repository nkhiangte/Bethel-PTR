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

const TitheInput: React.FC<{
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputRef: React.Ref<HTMLInputElement>;
}> = ({ value, onChange, onKeyDown, inputRef }) => (
    <input
        ref={inputRef}
        type="number"
        value={value === 0 ? '' : value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        min="0"
        placeholder="0"
        className="w-24 sm:w-28 text-right px-3 py-2 bg-sky-100 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-black"
    />
);

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
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
);

const CancelIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
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
  const editInputRef = useRef<HTMLInputElement>(null);
  const serialInputRef = useRef<HTMLInputElement>(null);

  const pathianRamRef = useRef<HTMLInputElement>(null);
  const ramtharRef = useRef<HTMLInputElement>(null);
  const tualchhungRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing]);

  const familyTotal = family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung;

  const handleInputChange = (category: TitheCategory) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onTitheChange(family.id, category, value);
  };
  
  const handleRemove = () => {
    if(window.confirm(`Are you sure you want to remove ${family.name}? This action cannot be undone.`)){
        onRemoveFamily(family.id);
    }
  };

  const handleEdit = () => {
    setEditedName(family.name);
    setEditedSerial(family.ipSerialNo?.toString() ?? '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(family.name);
    setEditedSerial(family.ipSerialNo?.toString() ?? '');
  };

  const handleSave = () => {
    if (editedName.trim() === '') {
        alert("Family name cannot be empty.");
        editInputRef.current?.focus();
        return;
    }

    const serialTrimmed = editedSerial.trim();
    let serialValue: number | null = null;

    if (serialTrimmed !== '') {
        const parsedSerial = Number(serialTrimmed);
        if (!Number.isInteger(parsedSerial) || parsedSerial < 1) {
            alert("IP Serial No. must be a whole number from 1 and above.");
            serialInputRef.current?.focus();
            serialInputRef.current?.select();
            return;
        }
        serialValue = parsedSerial;
    }
    
    onUpdateFamilyName(family.id, editedName);
    onUpdateIpSerialNo(family.id, serialValue);
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }

  const handleClearTithes = () => {
    onClearTithe(family.id);
  };

  const handleTitheInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, fromCategory: TitheCategory) => {
    if (e.key !== 'Enter') return;
    
    e.preventDefault();

    if (fromCategory === 'pathianRam') {
        ramtharRef.current?.focus();
        ramtharRef.current?.select();
    } else if (fromCategory === 'ramthar') {
        tualchhungRef.current?.focus();
        tualchhungRef.current?.select();
    } else if (fromCategory === 'tualchhung') {
        const currentRow = e.currentTarget.closest('tr');
        if (currentRow) {
            const nextRow = currentRow.nextElementSibling as HTMLTableRowElement | null;
            if (nextRow) {
                const nextInput = nextRow.querySelector('td:nth-child(3) input') as HTMLInputElement | null;
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                }
            } else {
                e.currentTarget.blur();
            }
        }
    }
  };

  return (
    <tr className="hover:bg-sky-100/50 transition-colors duration-200 group">
      <td className="px-2 py-4 sm:px-6 whitespace-nowrap">
        {isEditing ? (
            <input 
                ref={editInputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 bg-sky-100 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-black"
            />
        ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onOpenTitheModal(family)}
                className="text-sm font-medium text-black text-left hover:text-amber-600 transition-colors"
              >
                {family.name}
              </button>
              <button
                onClick={handleClearTithes}
                className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-100 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Clear all tithe entries for ${family.name}`}
                title="Clear all tithe entries for this family"
              >
                <CancelIcon className="w-4 h-4" />
              </button>
            </div>
        )}
      </td>
      <td className="px-2 py-4 sm:px-6 whitespace-nowrap">
        {isEditing ? (
            <input 
                ref={serialInputRef}
                type="number"
                value={editedSerial}
                onChange={(e) => setEditedSerial(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 1"
                min="1"
                className="w-24 px-3 py-2 bg-sky-100 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-black"
            />
        ) : (
             <span className="text-sm text-black">{family.ipSerialNo ?? 'N/A'}</span>
        )}
      </td>
      <td className="px-2 py-4 sm:px-6 whitespace-nowrap text-right">
        <TitheInput 
            inputRef={pathianRamRef}
            value={family.tithe.pathianRam} 
            onChange={handleInputChange('pathianRam')} 
            onKeyDown={e => handleTitheInputKeyDown(e, 'pathianRam')}
        />
      </td>
      <td className="px-2 py-4 sm:px-6 whitespace-nowrap text-right">
        <TitheInput 
            inputRef={ramtharRef}
            value={family.tithe.ramthar} 
            onChange={handleInputChange('ramthar')} 
            onKeyDown={e => handleTitheInputKeyDown(e, 'ramthar')}
        />
      </td>
      <td className="px-2 py-4 sm:px-6 whitespace-nowrap text-right">
        <TitheInput 
            inputRef={tualchhungRef}
            value={family.tithe.tualchhung} 
            onChange={handleInputChange('tualchhung')} 
            onKeyDown={e => handleTitheInputKeyDown(e, 'tualchhung')}
        />
      </td>
      <td className="px-2 py-4 sm:px-6 whitespace-nowrap text-right text-sm font-semibold text-black">
        {formatCurrency(familyTotal)}
      </td>
      <td className="px-2 py-4 sm:px-6 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {isEditing ? (
                <>
                    <button
                        onClick={handleSave}
                        className="text-slate-400 hover:text-green-600 transition-colors p-2 rounded-full hover:bg-green-100"
                        aria-label={`Save changes for ${family.name}`}
                    >
                        <SaveIcon className="w-5 h-5"/>
                    </button>
                    <button
                        onClick={handleCancel}
                        className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-100"
                        aria-label={`Cancel editing for ${family.name}`}
                    >
                        <CancelIcon className="w-5 h-5"/>
                    </button>
                </>
            ) : (
                <>
                    <button
                        onClick={handleEdit}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-100"
                        aria-label={`Edit ${family.name}`}
                    >
                        <EditIcon className="w-5 h-5"/>
                    </button>
                    <button
                        onClick={handleRemove}
                        className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-100"
                        aria-label={`Remove ${family.name}`}
                    >
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </>
            )}
        </div>
      </td>
    </tr>
  );
};
