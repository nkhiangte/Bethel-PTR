
import React, { useState, useEffect, useMemo } from 'react';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as api from '../api.ts';
import type { YearlyFamilyTotal } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface BialYearlyFamilyReportProps {
    year: number;
    upaBial: string;
    onBack: () => void;
    onGoToDashboard: () => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(value);
};

const PdfIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm-6.5-2H9v1.5h.5c.28 0 .5-.22.5-.5v-.5zm5 0h-1.5v1.5H15v-1c0-.28-.22-.5-.5zM4 6H2v14c0 1.1.9 2 2 2h14v-2-H4V6z"/>
    </svg>
);

const PrintIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM16 19H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM18 3H6v4h12V3z"/>
    </svg>
);

const ExportIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM13 12.67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
    </svg>
);


export const BialYearlyFamilyReport: React.FC<BialYearlyFamilyReportProps> = ({ year, upaBial, onBack, onGoToDashboard }) => {
    const [families, setFamilies] = useState<YearlyFamilyTotal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await api.fetchBialYearlyFamilyData(year, upaBial);
                setFamilies(data);
            } catch (e: any) {
                setError(e.message || 'Could not fetch bial yearly report data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [year, upaBial]);

    const totals = useMemo(() => {
        const acc = { pathianRam: 0, ramthar: 0, tualchhung: 0, grandTotal: 0 };
        families.forEach(family => {
            acc.pathianRam += family.tithe.pathianRam;
            acc.ramthar += family.tithe.ramthar;
            acc.tualchhung += family.tithe.tualchhung;
            acc.grandTotal += family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung;
        });
        return acc;
    }, [families]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        if (families.length === 0) return;

        const headerData = [
            [`${upaBial} Pathian Ram Thawhlawm Report`],
            [`Kum: ${year}`],
        ];
        headerData.push([]); // Empty row for spacing

        const worksheet = utils.aoa_to_sheet(headerData);

        const dataToExport = families.map(family => ({
            'S/N': family.ipSerialNo ?? 'N/A',
            'Chhungkua': family.name,
            'Pathian Ram': family.tithe.pathianRam,
            'Ramthar': family.tithe.ramthar,
            'Tualchhung': family.tithe.tualchhung,
            'Total': family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung,
        }));
        
        const footer = {
            'S/N': '',
            'Chhungkua': 'Grand Total',
            'Pathian Ram': totals.pathianRam,
            'Ramthar': totals.ramthar,
            'Tualchhung': totals.tualchhung,
            'Total': totals.grandTotal,
        };
        
        utils.sheet_add_json(worksheet, dataToExport, { origin: -1, skipHeader: false });
        utils.sheet_add_json(worksheet, [footer], { skipHeader: true, origin: -1 });

        const workbook = utils.book_new(); 
        utils.book_append_sheet(workbook, worksheet, "Bial Yearly Report");
        writeFile(workbook, `Tithe_Yearly_Report_${upaBial.replace(/ /g, '_')}_${year}.xlsx`);
    };

    const handleExportPdf = () => {
        if (!families || families.length === 0) return;

        const doc = new jsPDF({ orientation: 'landscape' });
    
        autoTable(doc, {
            body: [[`${upaBial} Yearly Tithe Report`], [`Year: ${year}`]],
            theme: 'plain',
            styles: { fontSize: 14, halign: 'center' },
        });

        const head = [['S/N', 'Chhungkua', 'Pathian Ram', 'Ramthar', 'Tualchhung', 'Total']];
        const body = families.map(f => [
            f.ipSerialNo ?? 'N/A',
            f.name,
            formatCurrency(f.tithe.pathianRam),
            formatCurrency(f.tithe.ramthar),
            formatCurrency(f.tithe.tualchhung),
            formatCurrency(f.tithe.pathianRam + f.tithe.ramthar + f.tithe.tualchhung),
        ]);

        const foot = [[
            '',
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
                0: { halign: 'left', cellWidth: 15 },
                1: { halign: 'left' }
            },
        });

        const fileName = `PathianRam_Yearly_Report_${upaBial.replace(/ /g, '_')}_${year}.pdf`;
        doc.save(fileName);
    };


    if (isLoading) return <LoadingSpinner message="Generating Bial Yearly Report..." />;
    if (error) return <div className="text-center p-8 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <div className="printable-area">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800">Yearly Report for {upaBial}</h2>
                    <p className="text-slate-600">
                        Summary of family contributions for the year {year}
                    </p>
                </div>
                 <div className="flex flex-wrap gap-2 sm:gap-4 no-print items-center">
                    <button
                        onClick={onGoToDashboard}
                        className="flex items-center gap-2 bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all text-sm"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={onBack}
                        className="bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all text-sm"
                    >
                        &larr; Back
                    </button>
                    
                    <div className="h-6 w-px bg-slate-300 mx-2 hidden sm:block"></div>
                    
                    <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 text-sm font-semibold shadow-sm transition-all" title="Export to Excel">
                        <ExportIcon className="w-4 h-4" />
                        <span>Excel</span>
                    </button>
                    <button onClick={handleExportPdf} className="flex items-center gap-2 bg-rose-600 text-white px-3 py-2 rounded-lg hover:bg-rose-700 text-sm font-semibold shadow-sm transition-all" title="Export to PDF">
                        <PdfIcon className="w-4 h-4" />
                        <span>PDF</span>
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold shadow-sm transition-all" title="Print Report">
                        <PrintIcon className="w-4 h-4" />
                        <span>Print</span>
                    </button>
                 </div>
            </div>
            <div className="overflow-x-auto">
                {families.length === 0 ? (
                    <div className="text-center p-8 text-slate-500">No data available for this Bial for the selected year.</div>
                ) : (
                    <table className="min-w-full divide-y divide-slate-200 border border-slate-200">
                        <thead className="bg-sky-100">
                            <tr>
                                <th scope="col" className="px-2 py-3 sm:px-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">S/N</th>
                                <th scope="col" className="px-2 py-3 sm:px-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Chhungkua</th>
                                <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Pathian Ram</th>
                                <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Ramthar</th>
                                <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Tualchhung</th>
                                <th scope="col" className="px-2 py-3 sm:px-4 text-right text-xs font-bold text-slate-800 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-sky-50 divide-y divide-slate-200">
                            {families.map(family => {
                                const total = family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung;
                                return (
                                    <tr key={family.id} className="hover:bg-sky-100/50">
                                        <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm text-slate-600">{family.ipSerialNo ?? <span className="text-slate-400 italic">N/A</span>}</td>
                                        <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm font-semibold text-slate-800">{family.name}</td>
                                        <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm text-slate-700 text-right">{formatCurrency(family.tithe.pathianRam)}</td>
                                        <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm text-slate-700 text-right">{formatCurrency(family.tithe.ramthar)}</td>
                                        <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm text-slate-700 text-right">{formatCurrency(family.tithe.tualchhung)}</td>
                                        <td className="px-2 py-3 sm:px-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">{formatCurrency(total)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-sky-200">
                             <tr>
                                <td className="px-2 py-4 sm:px-4 text-left text-sm font-extrabold text-slate-900 uppercase" colSpan={2}>Grand Total</td>
                                <td className="px-2 py-4 sm:px-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">{formatCurrency(totals.pathianRam)}</td>
                                <td className="px-2 py-4 sm:px-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">{formatCurrency(totals.ramthar)}</td>
                                <td className="px-2 py-4 sm:px-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">{formatCurrency(totals.tualchhung)}</td>
                                <td className="px-2 py-4 sm:px-4 whitespace-nowrap text-sm font-black text-amber-700 text-right">{formatCurrency(totals.grandTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
};
