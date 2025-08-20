

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AggregateReportData } from '../types.ts';
import { AIInsights } from './AIInsights.tsx';

interface YearlyReportProps {
  data: AggregateReportData;
  upaBials: string[];
  year: number;
  onBack: () => void;
  onGoToDashboard: () => void;
}

const CATEGORIES = {
    pathianRam: "Pathian Ram",
    ramthar: "Ramthar",
    tualchhung: "Tualchhung"
};
type CategoryKey = keyof typeof CATEGORIES;

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(value);
};

const ExportIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM13 12.67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
    </svg>
);

const PdfIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm-6.5-2H9v1.5h.5c.28 0 .5-.22.5-.5v-.5zm5 0h-1.5v1.5H15v-1c0-.28-.22-.5-.5-.5zM4 6H2v14c0 1.1.9 2 2 2h14v-2-H4V6z"/>
    </svg>
);

const PrintIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM16 19H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM18 3H6v4h12V3z"/>
    </svg>
);


export const YearlyReport: React.FC<YearlyReportProps> = ({ data, upaBials, year, onBack, onGoToDashboard }) => {
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
                setIsActionsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const grandTotals = useMemo(() => {
        const totals = { pathianRam: 0, ramthar: 0, tualchhung: 0, total: 0 };
        Object.values(data).forEach(bialData => {
            totals.pathianRam += bialData.pathianRam;
            totals.ramthar += bialData.ramthar;
            totals.tualchhung += bialData.tualchhung;
            totals.total += bialData.total;
        });
        return totals;
    }, [data]);

    const handleExport = () => {
        const header = ["Category", ...upaBials, "Grand Total"];
        
        const rows = (Object.keys(CATEGORIES) as CategoryKey[]).map(catKey => {
            const rowData: (string | number)[] = [CATEGORIES[catKey]];
            let rowTotal = 0;
            upaBials.forEach(bial => {
                const value = data[bial]?.[catKey] ?? 0;
                rowData.push(value);
                rowTotal += value;
            });
            rowData.push(rowTotal);
            return rowData;
        });

        const footer: (string | number)[] = ["Total"];
        let overallTotal = 0;
        upaBials.forEach(bial => {
            const total = data[bial]?.total ?? 0;
            footer.push(total);
            overallTotal += total;
        });
        footer.push(overallTotal);

        const worksheetData = [header, ...rows, footer];
        
        const worksheet = utils.aoa_to_sheet(worksheetData);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Yearly Report");
        
        const fileName = `Tithe_Report_${year}.xlsx`;
        writeFile(workbook, fileName);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
    
        autoTable(doc, {
            body: [[`Yearly Aggregate Report for ${year}`]],
            theme: 'plain',
            styles: { fontSize: 16, halign: 'center' },
        });

        const head = [['Category', ...upaBials.map(b => b.replace('Upa Bial ', 'Bial ')), 'Grand Total']];

        const body = (Object.keys(CATEGORIES) as CategoryKey[]).map(catKey => {
            const rowData: string[] = [CATEGORIES[catKey]];
            upaBials.forEach(bial => {
                rowData.push(formatCurrency(data[bial]?.[catKey] ?? 0));
            });
            rowData.push(formatCurrency(grandTotals[catKey]));
            return rowData;
        });

        const foot = [[
            'Total', 
            ...upaBials.map(bial => formatCurrency(data[bial]?.total ?? 0)), 
            formatCurrency(grandTotals.total)
        ]];
        
        autoTable(doc, {
            head: head,
            body: body,
            foot: foot,
            startY: (doc as any).lastAutoTable.finalY + 2,
            headStyles: { fillColor: [241, 245, 249], textColor: [48, 63, 84], fontStyle: 'bold' },
            footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
            styles: {
                halign: 'right',
                lineColor: [226, 232, 240],
                lineWidth: 0.1,
            },
            columnStyles: {
                0: { halign: 'left' }
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            }
        });

        const fileName = `PathianRam_Report_Kum_${year}.pdf`;
        doc.save(fileName);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="printable-area">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Yearly Aggregate Report</h2>
                    <p className="text-slate-600">Summary of contributions for the year {year}</p>
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
                        &larr; Back to Month Selection
                    </button>
                    <AIInsights 
                        reportData={data}
                        upaBials={upaBials}
                        period={`the year ${year}`}
                    />
                     <div className="relative" ref={actionsMenuRef}>
                        <button
                            onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                            className="flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all shadow-md"
                        >
                            <span>Export & Print</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isActionsMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                        {isActionsMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-sky-50 rounded-lg shadow-xl z-20 border border-slate-200">
                                <div className="py-1">
                                    <button onClick={() => { handleExport(); setIsActionsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-sky-100 hover:text-slate-900 transition-colors">
                                        <ExportIcon className="w-5 h-5 text-green-600" />
                                        <span>Export to Excel</span>
                                    </button>
                                    <button onClick={() => { handleExportPdf(); setIsActionsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-sky-100 hover:text-slate-900 transition-colors">
                                        <PdfIcon className="w-5 h-5 text-red-600" />
                                        <span>Export to PDF</span>
                                    </button>
                                    <button onClick={() => { handlePrint(); setIsActionsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-sky-100 hover:text-slate-900 transition-colors">
                                        <PrintIcon className="w-5 h-5 text-blue-600" />
                                        <span>Print</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200">
                    <thead className="bg-sky-100">
                        <tr>
                            <th scope="col" className="px-2 py-3 sm:px-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider sticky left-0 bg-sky-100 z-10">
                                Category
                            </th>
                            {upaBials.map(bial => (
                                <th key={bial} scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    {bial.replace('Upa Bial ', 'Bial ')}
                                </th>
                            ))}
                            <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-extrabold text-slate-800 uppercase tracking-wider sticky right-0 bg-sky-100 z-10 border-l border-slate-300">
                                Grand Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-sky-50 divide-y divide-slate-200">
                        {(Object.keys(CATEGORIES) as CategoryKey[]).map(catKey => (
                            <tr key={catKey} className="hover:bg-sky-100/50 group">
                                <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm font-semibold text-slate-800 sticky left-0 bg-sky-50 group-hover:bg-sky-100/50 z-10">
                                    {CATEGORIES[catKey]}
                                </td>
                                {upaBials.map(bial => (
                                    <td key={`${catKey}-${bial}`} className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm text-slate-700 text-right">
                                        {formatCurrency(data[bial]?.[catKey] ?? 0)}
                                    </td>
                                ))}
                                <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right sticky right-0 bg-sky-50 group-hover:bg-sky-100/50 z-10 border-l border-slate-200">
                                    {formatCurrency(grandTotals[catKey])}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-sky-200">
                         <tr>
                            <td className="px-2 py-4 sm:px-4 text-left text-sm font-extrabold text-slate-900 uppercase sticky left-0 bg-sky-200 z-10">
                                Total
                            </td>
                            {upaBials.map(bial => (
                                <td key={`total-${bial}`} className="px-2 py-4 sm:px-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">
                                    {formatCurrency(data[bial]?.total ?? 0)}
                                </td>
                            ))}
                            <td className="px-2 py-4 sm:px-4 whitespace-nowrap text-sm font-black text-amber-700 text-right sticky right-0 bg-sky-200 z-10 border-l border-slate-300">
                                {formatCurrency(grandTotals.total)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};