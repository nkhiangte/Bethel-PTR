

import React, { useState } from 'react';

interface AddFamilyFormProps {
  onAddFamily: (name: string) => void;
}

export const AddFamilyForm: React.FC<AddFamilyFormProps> = ({ onAddFamily }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFamily(name);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
      <label htmlFor="familyName" className="sr-only">
        Hming
      </label>
      <input
        id="familyName"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Hming"
        className="flex-grow w-full px-4 py-3 bg-sky-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow"
        required
      />
      <button
        type="submit"
        className="bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
      >
        Add Hming
      </button>
    </form>
  );
};