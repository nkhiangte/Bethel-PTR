import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as api from '../api.ts';
import type { FamilyYearlyTitheData, Tithe } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface FamilyYearlyReportProps {
    familyId: string;
    year: number;
    onBack: () => void;
    onGoToDashboard: () => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(value);
};

const PdfIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm-6.5-2H9v1.5h.5c.28 0 .5-.22.5-.5v-.5zm5 0h-1.5v1.5H15v-1c0-.28-.22-.5-.5zM4 6H2v14c0 1.1.9 2 2 2h14v-2-H4V6z"/>
    </svg>
);

const PrintIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM16 19H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM18 3H6v4h12V3z"/>
    </svg>
);


export const FamilyYearlyReport: React.FC<FamilyYearlyReportProps> = ({ familyId, year, onBack, onGoToDashboard }) => {
    const [reportData, setReportData] = useState<FamilyYearlyTitheData | null>(null);
    const [familyInfo, setFamilyInfo] = useState<{ name: string; ipSerialNo: number | null; } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data, familyInfo: info } = await api.fetchFamilyYearlyData(year, familyId);
                setReportData(data);
                setFamilyInfo(info);
            } catch (e: any) {
                setError(e.message || 'Could not fetch family report data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [year, familyId]);

    const totals = useMemo(() => {
        const acc = { pathianRam: 0, ramthar: 0, tualchhung: 0, grandTotal: 0 };
        if (!reportData) return acc;

        Object.values(reportData).forEach(tithe => {
            acc.pathianRam += tithe.pathianRam;
            acc.ramthar += tithe.ramthar;
            acc.tualchhung += tithe.tualchhung;
            acc.grandTotal += tithe.pathianRam + tithe.ramthar + tithe.tualchhung;
        });

        return acc;
    }, [reportData]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportPdf = () => {
        if (!reportData || !familyInfo) return;

        const doc = new jsPDF();
        const title = `Yearly Tithe Report for ${familyInfo.name}`;
        autoTable(doc, {
            body: [[title], [`Year: ${year}`]],
            theme: 'plain',
            styles: { fontSize: 14, halign: 'center' },
        });

        const head = [['Month', 'Pathian Ram', 'Ramthar', 'Tualchhung', 'Monthly Total']];
        const body = MONTHS.map(month => {
            const tithe = reportData[month] || { pathianRam: 0, ramthar: 0, tualchhung: 0 };
            const monthlyTotal = tithe.pathianRam + tithe.ramthar + tithe.tualchhung;
            return [
                month,
                formatCurrency(tithe.pathianRam),
                formatCurrency(tithe.ramthar),
                formatCurrency(tithe.tualchhung),
                formatCurrency(monthlyTotal),
            ];
        });

        const foot = [[
            'Grand Total',
            formatCurrency(totals.pathianRam),
            formatCurrency(totals.ramthar),
            formatCurrency(totals.tualchhung),
            formatCurrency(totals.grandTotal),
        ]];
        
        autoTable(doc, {
            head,
            body,
            foot,
            startY: (doc as any).lastAutoTable.finalY + 2,
            headStyles: { fillColor: [241, 245, 249], textColor: [48, 63, 84], fontStyle: 'bold' },
            footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
            styles: { halign: 'right', lineColor: [203, 213, 225], lineWidth: 0.1 },
            columnStyles: { 
                0: { halign: 'left' }, 
            },
        });

        doc.save(`Tithe_Report_${familyInfo.name.replace(/ /g, '_')}_${year}.pdf`);
    };

    if (isLoading) return <LoadingSpinner message="Generating Family Report..." />;
    if (error) return <div className="text-center p-8 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    if (!reportData || !familyInfo) return <div className="text-center p-8 text-slate-500">No data available for this family for the selected year.</div>;

    return (
        <div className="printable-area">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800">Yearly Tithe Report</h2>
                    <p className="text-slate-600">
                        <span className="font-semibold">{familyInfo.name}</span> for the year {year}
                    </p>
                </div>
                 <div className="flex flex-wrap gap-4 no-print">
                    <button
                        onClick={onGoToDashboard}
                        className="flex items-center gap-2 bg-slate-200 text-slate-800 font-semibold px-4 py-3 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={onBack}
                        className="bg-slate-200 text-slate-800 font-semibold px-6 py-3 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all"
                    >
                        &larr; Back to Data Entry
                    </button>
                    <button
                        onClick={handleExportPdf}
                        className="flex items-center gap-2 bg-red-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-md"
                    >
                        <PdfIcon className="w-5 h-5" />
                        Export to PDF
                    </button>
                     <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md"
                    >
                        <PrintIcon className="w-5 h-5" />
                        Print
                    </button>
                 </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200">
                    <thead className="bg-sky-100">
                        <tr>
                            <th scope="col" className="px-2 py-3 sm:px-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Month</th>
                            <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Pathian Ram</th>
                            <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Ramthar</th>
                            <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Tualchhung</th>
                            <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-800 uppercase tracking-wider">Monthly Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-sky-50 divide-y divide-slate-200">
                        {MONTHS.map(month => {
                            const tithe = reportData[month] || { pathianRam: 0, ramthar: 0, tualchhung: 0 };
                            const monthlyTotal = tithe.pathianRam + tithe.ramthar + tithe.tualchhung;
                            return (
                                <tr key={month} className="hover:bg-sky-100/50">
                                    <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm font-semibold text-slate-800">{month}</td>
                                    <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm text-slate-700 text-right">{formatCurrency(tithe.pathianRam)}</td>
                                    <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm text-slate-700 text-right">{formatCurrency(tithe.ramthar)}</td>
                                    <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm text-slate-700 text-right">{formatCurrency(tithe.tualchhung)}</td>
                                    <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">{formatCurrency(monthlyTotal)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-sky-200">
                         <tr>
                            <td className="px-2 py-4 sm:px-4 text-left text-sm font-extrabold text-slate-900 uppercase">Grand Total</td>
                            <td className="px-2 py-4 sm:px-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">{formatCurrency(totals.pathianRam)}</td>
                            <td className="px-2 py-4 sm:px-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">{formatCurrency(totals.ramthar)}</td>
                            <td className="px-2 py-4 sm:px-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">{formatCurrency(totals.tualchhung)}</td>
                            <td className="px-2 py-4 sm:px-4 whitespace-nowrap text-sm font-black text-amber-700 text-right">{formatCurrency(totals.grandTotal)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};
