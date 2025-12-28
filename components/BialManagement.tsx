import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api.ts';
import type { BialInfo } from '../types.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { BialRow } from './BialRow.tsx';

interface BialManagementProps {
    upaBials: string[];
    onBack: () => void;
    onGoToDashboard: () => void;
}

export const BialManagement: React.FC<BialManagementProps> = ({ upaBials, onBack, onGoToDashboard }) => {
    const [allBialInfo, setAllBialInfo] = useState<Map<string, BialInfo>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadInfo = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const infoMap = await api.fetchAllBialInfo();
                setAllBialInfo(infoMap);
            } catch (e: any) {
                setError("Failed to fetch Bial information. You may not have the required permissions.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadInfo();
    }, []);
    
    const handleSave = useCallback((bialName: string, newInfo: BialInfo) => {
        setAllBialInfo(prevMap => {
            const newMap = new Map(prevMap);
            newMap.set(bialName, newInfo);
            return newMap;
        });
    }, []);


    if (isLoading) {
        return <LoadingSpinner message="Loading Bial Data..." />;
    }

    if (error) {
        return <div className="text-center p-8 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Bial Vawngtu Management</h2>
                    <p className="text-slate-600">Assign Bial Vawngtu(te) for each Upa Bial.</p>
                </div>
                 <div className="flex flex-wrap gap-4">
                     <button
                        onClick={onGoToDashboard}
                        className="flex items-center gap-2 bg-slate-200 text-slate-800 font-semibold px-4 py-3 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={onBack}
                        className="bg-slate-200 text-slate-800 font-semibold px-6 py-3 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all"
                    >
                        &larr; Back
                    </button>
                 </div>
            </div>

            <div className="bg-sky-50 rounded-lg shadow-md overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-sky-100">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-1/4">
                                    Upa Bial
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-1/2">
                                    Bial Vawngtu (Hming leh Phone)
                                </th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-1/4">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                         <tbody className="bg-sky-50 divide-y divide-slate-200">
                            {upaBials.map(bial => (
                                <BialRow 
                                    key={bial}
                                    bialName={bial}
                                    bialInfo={allBialInfo.get(bial)}
                                    onSave={handleSave}
                                />
                            ))}
                         </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
