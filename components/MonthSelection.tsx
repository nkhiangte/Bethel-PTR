


import React from 'react';

interface MonthSelectionProps {
  months: string[];
  year: number;
  currentYear: number;
  onSelectMonth: (month: string) => void;
  onBack?: () => void;
  onGoToDashboard: () => void;
  onOpenImportModal: () => void;
  isDataEntryLocked: boolean;
  isAdmin: boolean;
  onExportReport: (type: 'monthly' | 'yearly', format: 'excel' | 'pdf', month?: string) => void;
  onViewYearlyReport?: () => void;
  isExporting: boolean;
}

const ExportIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM13 12.67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
    </svg>
);

const PdfIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm-6.5-2H9v1.5h.5c.28 0 .5-.22.5-.5v-.5zm5 0h-1.5v1.5H15v-1c0-.28-.22-.5-.5zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/>
    </svg>
);

const UploadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
    </svg>
);

export const MonthSelection: React.FC<MonthSelectionProps> = ({ 
    months, 
    year, 
    currentYear, 
    onSelectMonth, 
    onBack, 
    onGoToDashboard, 
    onOpenImportModal, 
    isDataEntryLocked,
    isAdmin,
    onExportReport,
    onViewYearlyReport,
    isExporting
}) => {
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
                 {isAdmin && (
                    <div className="flex gap-2 mr-2">
                        {onViewYearlyReport && (
                            <button
                                onClick={onViewYearlyReport}
                                className="flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all text-sm"
                                title="View Yearly Report"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                </svg>
                                <span className="hidden sm:inline">Yearly Report</span>
                            </button>
                        )}
                        <button
                            onClick={() => onExportReport('yearly', 'excel')}
                            disabled={isExporting}
                            className="flex items-center justify-center gap-2 bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all text-sm disabled:opacity-50"
                            title="Export Yearly Excel"
                        >
                            <ExportIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Yearly Excel</span>
                        </button>
                        <button
                            onClick={() => onExportReport('yearly', 'pdf')}
                            disabled={isExporting}
                            className="flex items-center justify-center gap-2 bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all text-sm disabled:opacity-50"
                            title="Export Yearly PDF"
                        >
                            <PdfIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Yearly PDF</span>
                        </button>
                    </div>
                 )}
                 <button
                    onClick={onOpenImportModal}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all text-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
                    aria-label="Import Contributions from file"
                    disabled={isDataEntryLocked} 
                >
                    <UploadIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Import</span>
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
          <div key={month} className="bg-sky-50 border border-slate-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col items-center overflow-hidden">
            <button
                onClick={() => onSelectMonth(month)}
                className="w-full p-4 sm:p-6 flex flex-col items-center justify-center gap-2 hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
            >
                <span className="text-lg sm:text-xl font-semibold">{month}</span>
            </button>
            {isAdmin && (
                <div className="w-full border-t border-slate-100 flex divide-x divide-slate-100 no-print">
                    <button
                        onClick={() => onExportReport('monthly', 'excel', month)}
                        disabled={isExporting}
                        className="flex-1 py-2 flex items-center justify-center gap-1 text-[10px] sm:text-xs font-medium text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                        title={`Export ${month} Excel`}
                    >
                        <ExportIcon className="w-4 h-4" />
                        <span>Excel</span>
                    </button>
                    <button
                        onClick={() => onExportReport('monthly', 'pdf', month)}
                        disabled={isExporting}
                        className="flex-1 py-2 flex items-center justify-center gap-1 text-[10px] sm:text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title={`Export ${month} PDF`}
                    >
                        <PdfIcon className="w-4 h-4" />
                        <span>PDF</span>
                    </button>
                </div>
            )}
          </div>
        ))}
      </div>
      {isExporting && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
                <p className="font-semibold text-slate-700">Generating Report...</p>
            </div>
        </div>
      )}
    </div>
  );
};
