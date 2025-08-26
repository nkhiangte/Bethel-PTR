import React, { useState, useRef } from 'react';
import { read, utils } from 'xlsx';
import type { Tithe } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface ContributionImportData {
  name: string;
  ipSerialNo: number | null;
  tithe: Tithe;
}

interface ImportResult {
    updated: number;
    created: number;
    skipped: number;
    skippedInfo: { name:string, reason:string }[];
}

interface ImportContributionsModalProps {
    year: number;
    upaBials: string[];
    selectedBial: string | null; // Pre-selected for non-admins
    onClose: () => void;
    onImport: (year: number, month: string, upaBial: string, data: ContributionImportData[]) => Promise<ImportResult>;
}

const ExcelIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H2.83Q2.5 20.75 2.24 20.5 2 20.26 2 19.92V4.08Q2 3.74 2.24 3.5 2.5 3.25 2.83 3.25M12 5.75L15.25 12 12 18.25H9.75L13 12 9.75 5.75M16.25 18H19V16.25H16.25M5 18H7.75V16.25H5Z"/>
    </svg>
);


export const ImportContributionsModal: React.FC<ImportContributionsModalProps> = ({ year, upaBials, selectedBial, onClose, onImport }) => {
    const [targetMonth, setTargetMonth] = useState('');
    const [targetBial, setTargetBial] = useState(selectedBial || '');
    const [fileData, setFileData] = useState<ContributionImportData[] | null>(null);
    const [fileName, setFileName] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError(null);
        setResult(null);
        setFileData(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                if (!data) throw new Error("Could not read file data.");

                const workbook = read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                const jsonData = utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: null
                });

                if (jsonData.length < 2) {
                    throw new Error("File is empty or contains no data rows.");
                }

                const headers = (jsonData[0] as any[]).map(h => String(h || '').trim().toLowerCase());
                const nameIndex = headers.indexOf('chhungkua');
                let serialIndex = headers.indexOf('sl.no');
                if (serialIndex === -1) serialIndex = headers.indexOf('s/n');
                const ptrIndex = headers.indexOf('pathian ram');
                const rtIndex = headers.indexOf('ramthar');
                const tchIndex = headers.indexOf('tualchhung');

                if (nameIndex === -1 || ptrIndex === -1 || rtIndex === -1 || tchIndex === -1) {
                    throw new Error("Invalid file format. Required columns are missing. Please include: 'Chhungkua', 'Pathian Ram', 'Ramthar', and 'Tualchhung'. 'Sl.No' or 'S/N' is optional.");
                }

                const importedData: ContributionImportData[] = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] as any[];
                    const name = row[nameIndex] ? String(row[nameIndex]).trim() : '';
                    if (!name) continue; // Skip rows without a family name

                    importedData.push({
                        name: name,
                        ipSerialNo: serialIndex > -1 ? (parseInt(row[serialIndex], 10) || null) : null,
                        tithe: {
                            pathianRam: parseFloat(row[ptrIndex]) || 0,
                            ramthar: parseFloat(row[rtIndex]) || 0,
                            tualchhung: parseFloat(row[tchIndex]) || 0,
                        },
                    });
                }
                
                if (importedData.length === 0) {
                    throw new Error("No valid data rows found in the file.");
                }
                setFileData(importedData);

            } catch (err: any) {
                console.error("Error reading or parsing Excel file:", err);
                setError(err.message || 'There was an error processing the Excel file.');
            } finally {
                if(fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImportClick = async () => {
        if (!fileData || !targetMonth || !targetBial) return;
        
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const importResult = await onImport(year, targetMonth, targetBial, fileData);
            setResult(importResult);
        } catch(err: any) {
            setError(err.message || "An unknown error occurred during import.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div 
            className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex justify-center items-center"
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="bg-sky-50 rounded-2xl shadow-2xl w-full max-w-2xl m-4 p-8 transform transition-all max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Import Contributions</h2>
                        <p className="text-slate-500">Bulk upload tithe data for {year} from an Excel file.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="space-y-6">
                    {/* Step 1: Selections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!selectedBial && (
                            <div>
                                <label htmlFor="import-bial" className="block text-sm font-medium text-slate-700 mb-2">Upa Bial</label>
                                <select id="import-bial" value={targetBial} onChange={e => setTargetBial(e.target.value)} className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                                    <option value="" disabled>Select a Bial</option>
                                    {upaBials.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label htmlFor="import-month" className="block text-sm font-medium text-slate-700 mb-2">Month</label>
                            <select id="import-month" value={targetMonth} onChange={e => setTargetMonth(e.target.value)} className="w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                                <option value="" disabled>Select a Month</option>
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    {/* Step 2: File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Upload File</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                           <div className="space-y-1 text-center">
                                <ExcelIcon className="mx-auto h-12 w-12 text-slate-400" />
                                <div className="flex text-sm text-slate-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-sky-50 rounded-md font-medium text-amber-600 hover:text-amber-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-amber-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="sr-only" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500">XLSX, XLS, or CSV</p>
                                {fileName && <p className="text-sm font-semibold text-green-700 pt-2">{fileName}</p>}
                            </div>
                        </div>
                         <div className="mt-4 text-xs text-slate-500 p-3 bg-sky-100 rounded-md border border-slate-200">
                            <p className="font-bold">File Format Instructions:</p>
                            <ul className="list-disc list-inside mt-1">
                                <li>The first row must be a header row.</li>
                                <li>Required columns: <strong>Chhungkua</strong>, <strong>Pathian Ram</strong>, <strong>Ramthar</strong>, <strong>Tualchhung</strong>.</li>
                                <li>Optional column: <strong>Sl.No</strong> (for more accurate matching). `S/N` is also accepted. Place this in the first column for best results.</li>
                                <li>Families not found in the database will be <strong>created automatically</strong>.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Results & Errors */}
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center">{error}</div>}
                    {result && (
                        <div className="bg-green-100 text-green-800 p-4 rounded-lg">
                            <h3 className="font-bold">Import Complete!</h3>
                            {result.updated > 0 && <p>{result.updated} existing families' contributions were updated.</p>}
                            {result.created > 0 && <p>{result.created} new families were created with their contributions.</p>}
                            {result.skipped > 0 && <p>{result.skipped} records were skipped.</p>}
                             {result.skippedInfo.length > 0 && (
                                <details className="mt-2 text-sm">
                                    <summary className="cursor-pointer font-semibold">Show skipped records</summary>
                                    <ul className="list-disc list-inside mt-1 pl-2 max-h-32 overflow-y-auto">
                                        {result.skippedInfo.map((s, i) => <li key={i}><strong>{s.name}</strong>: {s.reason}</li>)}
                                    </ul>
                                </details>
                            )}
                        </div>
                    )}
                    
                    {/* Actions */}
                     <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-4 border-t border-slate-200">
                        <button type="button" onClick={onClose} className="w-full sm:w-auto bg-sky-100 text-slate-700 font-semibold px-6 py-3 rounded-lg hover:bg-slate-200 transition-all">
                            Close
                        </button>
                        <button type="button" onClick={handleImportClick} disabled={!fileData || !targetMonth || !targetBial || isLoading} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition-all shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed">
                            {isLoading ? <><LoadingSpinner message='' className='p-0'/> <span>Importing...</span></> : 'Import Data'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};