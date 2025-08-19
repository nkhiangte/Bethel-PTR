
import React from 'react';

interface UpaBialSelectionProps {
  upaBials: string[];
  year?: number;
  month?: string;
  onSelectBial: (bial: string) => void;
  onBack?: () => void;
  onGoToDashboard: () => void;
}

export const UpaBialSelection: React.FC<UpaBialSelectionProps> = ({ upaBials, year, month, onSelectBial, onBack, onGoToDashboard }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
                {onBack && (
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        <span className="sr-only">Back to Previous Selection</span>
                    </button>
                )}
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                    {year && month ? `Select Upa Bial for ${month} ${year}` : 'Select an Upa Bial to Begin'}
                </h2>
            </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {upaBials.map(bial => (
          <button
            key={bial}
            onClick={() => onSelectBial(bial)}
            className="p-4 sm:p-6 bg-sky-50 border border-slate-200 rounded-xl shadow-sm hover:shadow-lg hover:border-amber-500 hover:text-amber-600 transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <span className="text-md sm:text-lg font-semibold">{bial}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
