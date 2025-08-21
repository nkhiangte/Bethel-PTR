

import React, { useMemo } from 'react';
import type { Family, TitheCategory } from '../types.ts';
import { TitheRow } from './TitheRow.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface TitheTableProps {
  families: Family[];
  isLoading: boolean;
  onTitheChange: (familyId: string, category: TitheCategory, value: number) => void;
  onRemoveFamily: (familyId: string) => void;
  onUpdateFamilyName: (familyId: string, newName: string) => void;
  onUpdateIpSerialNo: (familyId: string, newSerial: number | null) => void;
  onOpenTitheModal: (family: Family) => void;
  onOpenTransferModal: (family: Family) => void;
  onClearTithe: (familyId: string) => void;
  onViewFamilyReport: (family: {id: string; name: string}) => void;
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
    onViewFamilyReport
}) => {
    
  const totals = useMemo(() => {
    return families.reduce(
      (acc, family) => {
        acc.pathianRam += family.tithe.pathianRam;
        acc.ramthar += family.tithe.ramthar;
        acc.tualchhung += family.tithe.tualchhung;
        acc.grandTotal += family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung;
        return acc;
      },
      { pathianRam: 0, ramthar: 0, tualchhung: 0, grandTotal: 0 }
    );
  }, [families]);

  return (
    <div className="overflow-x-auto tithe-print-table">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-sky-100">
          <tr>
            <th scope="col" className="px-2 py-3 sm:px-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              S/N
            </th>
            <th scope="col" className="px-2 py-3 sm:px-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              Chhungkua
            </th>
            <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
              Pathian Ram
            </th>
            <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
              Ramthar
            </th>
            <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
              Tualchhung
            </th>
            <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
              Family Total
            </th>
            <th scope="col" className="px-2 py-3 sm:px-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider no-print">
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
              />
            ))
          )}
        </tbody>
        <tfoot className="bg-sky-200">
            <tr>
                <td className="px-2 py-4 sm:px-4 text-left text-sm font-bold text-black uppercase" colSpan={2}>Grand Total</td>
                <td className="px-2 py-4 sm:px-4 text-right text-sm font-bold text-black">{formatCurrency(totals.pathianRam)}</td>
                <td className="px-2 py-4 sm:px-4 text-right text-sm font-bold text-black">{formatCurrency(totals.ramthar)}</td>
                <td className="px-2 py-4 sm:px-4 text-right text-sm font-bold text-black">{formatCurrency(totals.tualchhung)}</td>
                <td className="px-2 py-4 sm:px-4 text-right text-sm font-extrabold text-black">{formatCurrency(totals.grandTotal)}</td>
                <td className="px-2 py-4 sm:px-4 no-print"></td>
            </tr>
        </tfoot>
      </table>
    </div>
  );
};