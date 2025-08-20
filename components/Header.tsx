


import React from 'react';

const ChurchIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 7.99V6c0-1.1-.9-2-2-2s-2 .9-2 2v.59L12 4.5l-6 3.5V6c0-1.1-.9-2-2-2s-2 .9-2 2v14h20V9.99l-2-1.25zM12 15l-3-3h6l-3 3zm-2-5h4v2h-4v-2zM2 20v-9.5l10-6.5 10 6.5V20H2z"/>
    </svg>
);

interface HeaderProps {
    onLogoClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="text-center">
       <div 
        className="inline-flex justify-center items-center gap-2 sm:gap-4 cursor-pointer group"
        onClick={onLogoClick}
        role="button"
        aria-label="Go to dashboard"
       >
        <ChurchIcon className="w-12 h-12 text-amber-600 group-hover:text-amber-700 transition-colors" />
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight group-hover:text-slate-800 transition-colors">
            Bethel PTR
        </h1>
      </div>
      <img 
        src="https://mizoramsynod.org/storage/photo/sBy7mWkYSqSQXfitakOsxKhJ08SoyKifJfOa0db8.jpg" 
        alt="Mizoram Synod Logo"
        className="mx-auto mt-6 h-24 w-auto cursor-pointer"
        onClick={onLogoClick}
      />
      <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
        Track and manage tithe contributions from families for each month and Upa Bial.
      </p>
    </header>
  );
};