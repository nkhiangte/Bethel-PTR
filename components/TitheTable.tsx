

import React, { useMemo } from 'react';
import type { FamilyWithTithe, TitheCategory } from '../types.ts';
import { TitheRow } from './TitheRow.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface TitheTableProps {
  families: FamilyWithTithe[];
  isLoading: boolean;
  onTitheChange: (familyId: string, category: TitheCategory, value: number) => void;
  onRemoveFamily: (familyId: string, year: number) => void; // Updated signature
  onUpdateFamilyName: (familyId: string, newName: string) => void;
  onUpdateIpSerialNo: (familyId: string, newSerial: number | null) => void;
  onOpenTitheModal: (family: FamilyWithTithe) => void;
  onOpenTransferModal: (family: FamilyWithTithe) => void;
  onClearTithe: (familyId: string) => void;
  onViewFamilyReport: (family: {id: string; name: string}) => void;
  currentYear: number; // New prop
  selectedYear: number; // New prop
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(value);
};

export const TitheTable: React.FC<TitheTableProps> = ({ 
    families, 
    isLoading,
    onTitheChange, 
    onRemoveFamily, 
    onUpdateFamilyName,
    onUpdateIpSerialNo,
    onOpenTitheModal,
    onOpenTransferModal,
    onClearTithe,
    onViewFamilyReport,
    currentYear, // Destructure new prop
    selectedYear // Destructure new prop
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

  return (
    <div className="overflow-x-auto tithe-print-table">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-sky-100">
          <tr>
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
                <td colSpan={7}>
                    <LoadingSpinner message="Fetching data..." />
                </td>
            </tr>
          ) : families.length === 0 ? (
            <tr>
                <td colSpan={7} className="px-2 py-10 sm:px-6 text-center text-slate-500">
                    No families added yet. Please use the form above to add a family.
                </td>
            </tr>
          ) : (
            families.map((family) => (
              <TitheRow
                key={family.id}
                family={family}
                onTitheChange={onTitheChange}
                onRemoveFamily={onRemoveFamily}
                onUpdateFamilyName={onUpdateFamilyName}
                onUpdateIpSerialNo={onUpdateIpSerialNo}
                onOpenTitheModal={onOpenTitheModal}
                onOpenTransferModal={onOpenTransferModal}
                onClearTithe={onClearTithe}
                onViewFamilyReport={onViewFamilyReport}
                formatCurrency={formatCurrency}
                currentYear={currentYear} // Pass new prop
                selectedYear={selectedYear} // Pass new prop
              />
            ))
          )}
        </tbody>
        <tfoot className="bg-sky-200 divide-y divide-slate-300">
            <tr>
                <td className="px-2 py-3 sm:px-3 text-left text-sm font-semibold text-slate-800" colSpan={2}>
                    Thawhlawm pe zat / Chhungkaw zat
                </td>
                <td className="px-2 py-3 sm:px-3 text-right text-sm font-bold text-slate-800" colSpan={5}>
                    {payingFamiliesCount} / {families.length}
                </td>
            </tr>
            <tr>
                <td className="px-2 py-4 sm:px-3 text-left text-sm font-bold text-black uppercase" colSpan={2}>Grand Total</td>
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