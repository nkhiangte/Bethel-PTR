
import React, { useMemo, useState, useEffect } from 'react';
import type { FamilyWithTithe, TitheCategory } from '../types.ts';
import { TitheRow } from './TitheRow.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface TitheTableProps {
  families: FamilyWithTithe[];
  isLoading: boolean;
  onTitheChange: (familyId: string, category: TitheCategory, value: number) => void;
  onRemoveFamily: (familyId: string, year: number) => void; 
  onUnassignFamily: (familyId: string) => void; // New prop for global unassign
  onBulkRemoveFamilies: (familyIds: string[]) => void;
  onUpdateFamilyName: (familyId: string, newName: string) => void;
  onUpdateIpSerialNo: (familyId: string, newSerial: number | null) => void;
  onOpenTitheModal: (family: FamilyWithTithe) => void;
  onOpenTransferModal: (family: FamilyWithTithe) => void;
  onClearTithe: (familyId: string) => void;
  onViewFamilyReport: (family: {id: string; name: string}) => void;
  currentYear: number;
  selectedYear: number;
  isDataEntryLocked: boolean;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(value);
};

export const TitheTable: React.FC<TitheTableProps> = ({ 
    families, 
    isLoading,
    onTitheChange, 
    onRemoveFamily, 
    onUnassignFamily, // Destructure new prop
    onBulkRemoveFamilies,
    onUpdateFamilyName,
    onUpdateIpSerialNo,
    onOpenTitheModal,
    onOpenTransferModal,
    onClearTithe,
    onViewFamilyReport,
    currentYear, 
    selectedYear, 
    isDataEntryLocked 
}) => {
    
  const { totals, payingFamiliesCount } = useMemo(() => {
    const calculatedTotals = {
        pathianRam: 0,
        ramthar: 0,
        tualchhung: 0,
        grandTotal: 0
    };
    let count = 0;

    for (const family of families) {
        const familyTotal = family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung;
        
        calculatedTotals.pathianRam += family.tithe.pathianRam;
        calculatedTotals.ramthar += family.tithe.ramthar;
        calculatedTotals.tualchhung += family.tithe.tualchhung;
        calculatedTotals.grandTotal += familyTotal;
        
        if (familyTotal > 0) {
            count++;
        }
    }
    
    return { totals: calculatedTotals, payingFamiliesCount: count };
  }, [families]);

  // Selection Logic
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection when families list changes (e.g. filter or month change)
  useEffect(() => {
      setSelectedIds(new Set());
  }, [families]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedIds(new Set(families.map(f => f.id)));
      } else {
          setSelectedIds(new Set());
      }
  };

  const handleSelectRow = (id: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
          newSelected.delete(id);
      } else {
          newSelected.add(id);
      }
      setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
      if (selectedIds.size === 0) return;
      if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected families?\n\nThis will remove them from this Bial for the selected year and delete their contributions for this year.`)) {
          onBulkRemoveFamilies(Array.from(selectedIds));
          setSelectedIds(new Set());
      }
  };

  const allSelected = families.length > 0 && selectedIds.size === families.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < families.length;

  return (
    <div className="overflow-x-auto tithe-print-table">
        {selectedIds.size > 0 && (
            <div className="bg-amber-50 p-2 mb-2 rounded-md flex justify-between items-center border border-amber-200 no-print">
                <span className="text-sm font-bold text-amber-800 ml-2">{selectedIds.size} families selected</span>
                <button 
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={isDataEntryLocked}
                >
                    Delete Selected
                </button>
            </div>
        )}
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-sky-100">
          <tr>
            <th scope="col" className="px-2 py-2 w-8 text-center no-print">
                <input 
                    type="checkbox" 
                    checked={allSelected} 
                    ref={input => { if (input) input.indeterminate = isIndeterminate; }}
                    onChange={handleSelectAll}
                    disabled={isDataEntryLocked || families.length === 0}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
            </th>
            <th scope="col" className="px-2 py-2 sm:px-3 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
              S/N
            </th>
            <th scope="col" className="px-2 py-2 sm:px-3 text-left text-sm font-bold text-slate-600 uppercase tracking-wider">
              Chhungkua
            </th>
            <th scope="col" className="px-2 py-2 sm:px-3 text-right text-sm font-bold text-slate-600 uppercase tracking-wider">
              PTR
            </th>
            <th scope="col" className="px-2 py-2 sm:px-3 text-right text-sm font-bold text-slate-600 uppercase tracking-wider">
              RT
            </th>
            <th scope="col" className="px-2 py-2 sm:px-3 text-right text-sm font-bold text-slate-600 uppercase tracking-wider">
              TCH
            </th>
            <th scope="col" className="px-2 py-2 sm:px-3 text-right text-sm font-bold text-slate-600 uppercase tracking-wider">
              Total
            </th>
            <th scope="col" className="px-2 py-2 sm:px-3 text-center text-sm font-bold text-slate-600 uppercase tracking-wider no-print">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-sky-50 divide-y divide-slate-200">
          {isLoading ? (
            <tr>
                <td colSpan={8}>
                    <LoadingSpinner message="Fetching data..." />
                </td>
            </tr>
          ) : families.length === 0 ? (
            <tr>
                <td colSpan={8} className="px-2 py-10 sm:px-6 text-center text-slate-500">
                    No families added yet. Please use the form above to add a family.
                </td>
            </tr>
          ) : (
            families.map((family) => (
              <TitheRow
                key={family.id}
                family={family}
                isSelected={selectedIds.has(family.id)}
                onToggleSelect={() => handleSelectRow(family.id)}
                onTitheChange={onTitheChange}
                onRemoveFamily={onRemoveFamily}
                onUnassignFamily={onUnassignFamily} // Pass to row
                onUpdateFamilyName={onUpdateFamilyName}
                onUpdateIpSerialNo={onUpdateIpSerialNo}
                onOpenTitheModal={onOpenTitheModal}
                onOpenTransferModal={onOpenTransferModal}
                onClearTithe={onClearTithe}
                onViewFamilyReport={onViewFamilyReport}
                formatCurrency={formatCurrency}
                currentYear={currentYear} 
                selectedYear={selectedYear} 
                isDataEntryLocked={isDataEntryLocked} 
              />
            ))
          )}
        </tbody>
        <tfoot className="bg-sky-200 divide-y divide-slate-300">
            <tr>
                <td className="px-2 py-3 sm:px-3 text-left text-sm font-semibold text-slate-800" colSpan={3}>
                    Thawhlawm pe zat / Chhungkaw zat
                </td>
                <td className="px-2 py-3 sm:px-3 text-right text-sm font-bold text-slate-800" colSpan={5}>
                    {payingFamiliesCount} / {families.length}
                </td>
            </tr>
            <tr>
                <td className="px-2 py-4 sm:px-3 text-left text-sm font-bold text-black uppercase" colSpan={3}>Grand Total</td>
                <td className="px-2 py-4 sm:px-3 text-right text-sm font-bold text-black">{formatCurrency(totals.pathianRam)}</td>
                <td className="px-2 py-4 sm:px-3 text-right text-sm font-bold text-black">{formatCurrency(totals.ramthar)}</td>
                <td className="px-2 py-4 sm:px-3 text-right text-sm font-bold text-black">{formatCurrency(totals.tualchhung)}</td>
                <td className="px-2 py-4 sm:px-3 text-right text-sm font-extrabold text-black">{formatCurrency(totals.grandTotal)}</td>
                <td className="px-2 py-4 sm:px-3 no-print"></td>
            </tr>
        </tfoot>
      </table>
    </div>
  );
};
