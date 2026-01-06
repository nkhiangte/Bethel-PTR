
import React from 'react';

interface MonthSelectionProps {
  months: string[];
  year: number;
  currentYear: number; // New prop
  onSelectMonth: (month: string) => void;
  onBack?: () => void;
  onGoToDashboard: () => void;
  onOpenImportModal: () => void;
  isDataEntryLocked: boolean; // New prop
}

const UploadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
    </svg>
);

export const MonthSelection: React.FC<MonthSelectionProps> = ({ months, year, currentYear, onSelectMonth, onBack, onGoToDashboard, onOpenImportModal, isDataEntryLocked }) => {
  return (
    <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center">
                {onBack && (
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors mr-2 sm:mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        <span className="sr-only">Back to Year Selection</span>
                    </button>
                )}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Kum {year} atan A Thla thlang rawn</h2>
                  <p className="text-slate-500">Select a month to enter tithe data.</p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-shrink-0 gap-2">
                 <button
                    onClick={onOpenImportModal}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all text-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
                    aria-label="Import Contributions from file"
                    disabled={isDataEntryLocked} // Disable button if data entry is locked
                >
                    <UploadIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Import Contributions</span>
                </button>
                <button
                    onClick={onGoToDashboard}
                    className="flex items-center gap-2 bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all text-sm"
                    aria-label="Back to Dashboard"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <span className="hidden sm:inline">Dashboard</span>
                </button>
            </div>
        </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {months.map(month => (
          <button
            key={month}
            onClick={() => onSelectMonth(month)}
            className="p-4 sm:p-6 bg-sky-50 border border-slate-200 rounded-xl shadow-sm hover:shadow-lg hover:border-amber-500 hover:text-amber-600 transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <span className="text-lg sm:text-xl font-semibold">{month}</span>
          </button>
        ))}
      </div>
    </div>
  );
};