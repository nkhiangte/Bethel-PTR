
import React from 'react';

interface HeaderProps {
    onLogoClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="text-center">
       <div 
        className="inline-block cursor-pointer group"
        onClick={onLogoClick}
        role="button"
        aria-label="Go to dashboard"
       >
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight group-hover:text-slate-800 transition-colors">
            Champhai Bethel Presbyterian Kohhran
        </h1>
      </div>
      <img 
        src="https://i.postimg.cc/RFsN0WkF/pci-logo.png" 
        alt="PCI Logo"
        className="mx-auto mt-6 h-24 w-auto cursor-pointer"
        onClick={onLogoClick}
      />
      <p className="mt-4 text-2xl text-slate-700 font-semibold max-w-2xl mx-auto">
        Pathian Ram Thawhlawm
      </p>
    </header>
  );
};