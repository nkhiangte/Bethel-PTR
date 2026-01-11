
import React, { useRef } from 'react';
import { read, utils, writeFile } from 'xlsx';

interface FamilyImportData {
  name: string;
  ipSerialNo: number | null;
}

interface ImportFamiliesProps {
  onImport: (families: FamilyImportData[], onResult: (message: string) => void) => void;
  isDisabled: boolean;
}

const ExcelIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H2.83Q2.5 20.75 2.24 20.5 2 20.26 2 19.92V4.08Q2 3.74 2.24 3.5 2.5 3.25 2.83 3.25M12 5.75L15.25 12 12 18.25H9.75L13 12 9.75 5.75M16.25 18H19V16.25H16.25M5 18H7.75V16.25H5Z"/>
    </svg>
);

const DownloadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>
);

export const ImportFamilies: React.FC<ImportFamiliesProps> = ({ onImport, isDisabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const templateData = [
      ["S/N", "Family Name"],
      [101, "Lalbiakliana"],
      [102, "Zonunsanga"],
      [103, "Rochungnunga"],
      [104, "Laltanpuia"]
    ];
    const ws = utils.aoa_to_sheet(templateData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Families");
    writeFile(wb, "family_import_template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) return;

        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData: any[][] = utils.sheet_to_json(worksheet, { header: 1, defval: null });
        
        if (jsonData.length === 0) {
            alert('The uploaded file is empty.');
            return;
        }

        const familiesToImport: FamilyImportData[] = [];
        const firstRow = (jsonData[0] || []).map(h => String(h || '').toLowerCase());
        
        let nameColIndex = firstRow.findIndex(h => h.includes('name') || h.includes('chhungkua') || h.includes('hming'));
        let serialColIndex = firstRow.findIndex(h => h.includes('sl') || h.includes('s/n') || h.includes('serial'));

        if (nameColIndex === -1) nameColIndex = 0;

        const looksLikeHeader = firstRow[0].includes('name') || firstRow[0].includes('hming') || firstRow[0].includes('chhungkua') || firstRow[0].includes('s/n') || firstRow[0].includes('serial');
        const startRow = looksLikeHeader ? 1 : 0;

        for (let i = startRow; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;
            
            const name = row[nameColIndex] ? String(row[nameColIndex]).trim() : '';
            if (!name) continue;

            const serialNoRaw = serialColIndex !== -1 ? row[serialColIndex] : null;
            const serialNo = (serialNoRaw !== null && !isNaN(parseInt(serialNoRaw, 10))) ? parseInt(serialNoRaw, 10) : null;

            familiesToImport.push({ name, ipSerialNo: serialNo });
        }
        
        if (familiesToImport.length > 0) {
            onImport(familiesToImport, (message) => alert(message));
        } else {
            alert('No valid family names found. Please check your file.');
        }

      } catch (error) {
        console.error("Error processing file:", error);
        alert('There was an error processing the file.');
      }
      if(fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <button
        type="button"
        onClick={downloadTemplate}
        className="flex items-center justify-center gap-2 bg-slate-200 text-slate-700 font-semibold px-4 py-3 rounded-lg hover:bg-slate-300 focus:outline-none transition-all text-sm shadow-sm"
        title="Download Template (S/N & Name)"
      >
        <DownloadIcon className="w-4 h-4" />
        Template
      </button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv"
        disabled={isDisabled}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none transition-all shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
        disabled={isDisabled}
      >
        <ExcelIcon className="w-5 h-5" />
        Import Names
      </button>
    </div>
  );
};
