import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string; className?: string }> = ({ message = 'Loading...', className = '' }) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    {message && <p className="mt-4 text-slate-600 font-semibold">{message}</p>}
  </div>
);
