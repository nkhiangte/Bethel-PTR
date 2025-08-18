
import React from 'react';

const ChurchIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 7.99V6c0-1.1-.9-2-2-2s-2 .9-2 2v.59L12 4.5l-6 3.5V6c0-1.1-.9-2-2-2s-2 .9-2 2v14h20V9.99l-2-1.25zM12 15l-3-3h6l-3 3zm-2-5h4v2h-4v-2zM2 20v-9.5l10-6.5 10 6.5V20H2z"/>
    </svg>
);

interface HeaderProps {
    onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <header className="text-center relative">
       <div className="flex justify-center items-center gap-2 sm:gap-4">
        <ChurchIcon className="w-12 h-12 text-amber-600" />
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Bethel PTR
        </h1>
      </div>
      <img 
        src="https://mizoramsynod.org/storage/photo/sBy7mWkYSqSQXfitakOsxKhJ08SoyKifJfOa0db8.jpg" 
        alt="Mizoram Synod Logo"
        className="mx-auto mt-6 h-24 w-auto"
      />
      <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
        Track and manage tithe contributions from families for each month and Upa Bial.
      </p>
      {onLogout && (
          <div className="absolute top-0 right-0">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-all shadow-md"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
              <span>Logout</span>
            </button>
          </div>
        )}
    </header>
  );
};