
import React, { useState } from 'react';

interface YearSelectionProps {
  years: number[];
  onSelectYear: (year: number) => void;
  onBack?: () => void;
}

export const YearSelection: React.FC<YearSelectionProps> = ({ years, onSelectYear, onBack }) => {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const currentDefaultYear = new Date().getFullYear().toString();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const yearToSubmit = selectedYear || currentDefaultYear;
    if (yearToSubmit) {
      onSelectYear(parseInt(yearToSubmit, 10));
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
              {onBack && (
                  <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors mr-2 sm:mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      <span className="sr-only">Back to Previous Step</span>
                  </button>
              )}
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Kum thlang rawh</h2>
          </div>
      </div>
      <div className="text-center">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="relative">
            <label htmlFor="year-select" className="sr-only">Select Year</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={handleSelectChange}
              className="w-full px-4 py-4 text-lg text-slate-700 bg-sky-50 border border-slate-300 rounded-lg appearance-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow"
            >
              <option value="" disabled>-- Select a Year --</option>
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-700">
              <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            disabled={!selectedYear}
            className="w-full bg-amber-600 text-white font-semibold px-6 py-4 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};
