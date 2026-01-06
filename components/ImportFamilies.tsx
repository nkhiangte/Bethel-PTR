

import React, { useRef } from 'react';
import { read, utils } from 'xlsx';

interface FamilyImportData {
  name: string;
  ipSerialNo: number | null;
}

interface ImportFamiliesProps {
  onImport: (families: FamilyImportData[], onResult: (message: string) => void) => void;
  isDisabled: boolean; // New prop
}

const ExcelIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 2h14v2H2V2zm0 4h14v2H2V6zm0 4h14v2H2v-2zm10 4H2v2h10v-2zm0 4H2v2h10v-2zm4-4h4v10h-4V12zm2 8.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" opacity="0"/>
        <path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H2.83Q2.5 20.75 2.24 20.5 2 20.26 2 19.92V4.08Q2 3.74 2.24 3.5 2.5 3.25 2.83 3.25M12 5.75L15.25 12 12 18.25H9.75L13 12 9.75 5.75M16.25 18H19V16.25H16.25M5 18H7.75V16.25H5Z"/>
    </svg>
);


export const ImportFamilies: React.FC<ImportFamiliesProps> = ({ onImport, isDisabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return; // Prevent file processing if disabled
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
        
        const familiesToImport: FamilyImportData[] = [];
        const range = utils.decode_range(worksheet['!ref'] || 'A1');

        // Manually iterate over rows to ensure all are read
        for (let R = range.s.r; R <= range.e.r; ++R) {
            // Read S/N from column A (c: 0)
            const serialCellRef = utils.encode_cell({ c: 0, r: R });
            const serialCell = worksheet[serialCellRef];
            const serialNo = serialCell && serialCell.v != null ? parseInt(String(serialCell.v), 10) : null;

            // Read Name from column B (c: 1)
            const nameCellRef = utils.encode_cell({ c: 1, r: R });
            const nameCell = worksheet[nameCellRef];
            const name = nameCell && nameCell.v != null ? String(nameCell.v).trim() : '';

            // We only import rows that have a family name.
            if (name) {
                familiesToImport.push({
                    name,
                    ipSerialNo: (serialNo !== null && !isNaN(serialNo)) ? serialNo : null,
                });
            }
        }
        
        if (familiesToImport.length > 0) {
            onImport(familiesToImport, (message) => {
                alert(message);
            });
        } else {
            alert('No valid family names found in the second column of the Excel sheet. Please ensure S/N is in the first column and Family Name is in the second.');
        }

      } catch (error) {
        console.error("Error reading or parsing Excel file:", error);
        alert('There was an error processing the Excel file. Please ensure it is a valid format, S/N is in the first column, and Family Name is in the second.');
      }
      // Reset the input so user can select the same file again
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleButtonClick = () => {
    if (isDisabled) return; // Prevent click if disabled
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv"
        aria-hidden="true"
        tabIndex={-1}
        disabled={isDisabled} // Disable file input
      />
      <button
        type="button"
        onClick={handleButtonClick}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
        disabled={isDisabled} // Disable button
      >
        <ExcelIcon className="w-5 h-5" />
        Import Families
      </button>
    </div>
  );
};