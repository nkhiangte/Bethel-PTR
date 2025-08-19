
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AddFamilyForm } from './components/AddFamilyForm.tsx';
import { Header } from './components/Header.tsx';
import { TitheTable } from './components/TitheTable.tsx';
import { ImportFamilies } from './components/ImportFamilies.tsx';
import { TitheModal } from './components/TitheModal.tsx';
import { AggregateReport } from './components/AggregateReport.tsx';
import { YearSelection } from './components/YearSelection.tsx';
import { MonthSelection } from './components/MonthSelection.tsx';
import { UpaBialSelection } from './components/UpaBialSelection.tsx';
import { YearlyReport } from './components/YearlyReport.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import * as api from './api.ts';
import type { Family, TitheCategory, Tithe, AggregateReportData } from './types.ts';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const UPA_BIALS = Array.from({ length: 13 }, (_, i) => `Upa Bial ${i + 1}`);

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

interface AppProps {
  onLogout: () => void;
  assignedBial: string | null;
}

const App: React.FC<AppProps> = ({ onLogout, assignedBial }) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedUpaBial, setSelectedUpaBial] = useState<string | null>(null);
  
  const [families, setFamilies] = useState<Family[]>([]);
  const [monthlyReportData, setMonthlyReportData] = useState<AggregateReportData | null>(null);
  const [yearlyReportData, setYearlyReportData] = useState<AggregateReportData | null>(null);
  
  const [familyForModal, setFamilyForModal] = useState<Family | null>(null);
  const [view, setView] = useState<'entry' | 'report' | 'yearlyReport'>('entry');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearSelections = useCallback(() => {
    setSelectedYear(null);
    setSelectedMonth(null);
    // For restricted users, keep their bial selected
    if (!assignedBial) {
        setSelectedUpaBial(null);
    }
    setFamilies([]);
    setMonthlyReportData(null);
    setYearlyReportData(null);
    setView('entry');
    setError(null);
  }, [assignedBial]);

  // Effect to auto-select bial for restricted users on login
  useEffect(() => {
    if (assignedBial) {
        setSelectedUpaBial(assignedBial);
    }
  }, [assignedBial]);


  // Effect to fetch families when selection is complete
  useEffect(() => {
    if (selectedYear && selectedMonth && selectedUpaBial) {
      const fetchFam = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedFamilies = await api.fetchFamilies(selectedYear, selectedMonth, selectedUpaBial);
          setFamilies(fetchedFamilies);
        } catch (e) {
          setError('Could not fetch family data.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchFam();
    } else {
        setFamilies([]);
    }
  }, [selectedYear, selectedMonth, selectedUpaBial]);
  
  // Effect to fetch monthly report data when view changes
  useEffect(() => {
    if (view === 'report' && selectedYear && selectedMonth) {
        const fetchReport = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await api.fetchMonthlyReport(selectedYear, selectedMonth);
                setMonthlyReportData(data);
            } catch(e) {
                setError('Could not fetch monthly report data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchReport();
    }
  }, [view, selectedYear, selectedMonth]);

  // Effect to fetch yearly report data when view changes
  useEffect(() => {
    if (view === 'yearlyReport' && selectedYear) {
        const fetchReport = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await api.fetchYearlyReport(selectedYear);
                setYearlyReportData(data);
            } catch(e) {
                setError('Could not fetch yearly report data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchReport();
    }
  }, [view, selectedYear]);


  const handleAddFamily = useCallback(async (name: string) => {
    if (name.trim() === '' || !selectedYear || !selectedMonth || !selectedUpaBial) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.addFamily(selectedYear, selectedMonth, selectedUpaBial, name.trim());
      const updatedFamilies = await api.fetchFamilies(selectedYear, selectedMonth, selectedUpaBial);
      setFamilies(updatedFamilies);
    } catch (e: any) {
      setError(e.message || 'Failed to add family.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedUpaBial]);

   const handleImportFamilies = useCallback(async (names: string[], onResult: (message: string) => void) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial) return;
    setIsLoading(true);
    setError(null);
    try {
        const { added, skipped } = await api.importFamilies(selectedYear, selectedMonth, selectedUpaBial, names);
        
        let message = `${added} new families imported successfully!`;
        if (skipped > 0) {
            message += `\n${skipped} families were skipped because they already exist or were duplicates in the file.`;
        }
        onResult(message);

        const updatedFamilies = await api.fetchFamilies(selectedYear, selectedMonth, selectedUpaBial);
        setFamilies(updatedFamilies);
    } catch (e) {
        setError('Failed to import families.');
    } finally {
        setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedUpaBial]);

  const handleTitheChange = useCallback((familyId: string, category: TitheCategory, value: number) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial) return;
    
    setFamilies(prevFamilies => {
        const familyIndex = prevFamilies.findIndex(f => f.id === familyId);
        if (familyIndex === -1) return prevFamilies;

        const updatedFamily = {
            ...prevFamilies[familyIndex],
            tithe: { ...prevFamilies[familyIndex].tithe, [category]: value }
        };

        const newFamilies = [...prevFamilies];
        newFamilies[familyIndex] = updatedFamily;

        setError(null);
        api.updateFamily(selectedYear, selectedMonth, selectedUpaBial, familyId, { tithe: updatedFamily.tithe })
            .catch(() => {
                setError("Failed to save changes. Reverting.");
                setFamilies(prevFamilies);
            });
            
        return newFamilies;
    });
  }, [selectedYear, selectedMonth, selectedUpaBial]);
  
  const handleRemoveFamily = useCallback((familyId: string) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial) return;

    setFamilies(prevFamilies => {
        const newFamilies = prevFamilies.filter(f => f.id !== familyId);

        setError(null);
        api.removeFamily(selectedYear, selectedMonth, selectedUpaBial, familyId)
            .catch(() => {
                setError("Failed to remove family. Reverting.");
                setFamilies(prevFamilies);
            });
        
        return newFamilies;
    });
  }, [selectedYear, selectedMonth, selectedUpaBial]);

  const handleUpdateFamilyName = useCallback((familyId: string, newName: string) => {
    if (newName.trim() === '' || !selectedYear || !selectedMonth || !selectedUpaBial) return;
    const trimmedName = newName.trim();

    setError(null);
    const originalFamilies = families; // Keep a copy for revert
    
    setFamilies(prevFamilies => prevFamilies.map(f => f.id === familyId ? { ...f, name: trimmedName } : f));

    api.updateFamily(selectedYear, selectedMonth, selectedUpaBial, familyId, { name: trimmedName })
        .catch((e: any) => {
            setError(e.message || "Failed to update name. Reverting.");
            setFamilies(originalFamilies);
        });
  }, [selectedYear, selectedMonth, selectedUpaBial, families]);

  const handleUpdateIpSerialNo = useCallback((familyId: string, newSerial: number | null) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial) return;

    setError(null);
    const originalFamilies = families; // Keep a copy for revert

    setFamilies(prevFamilies => prevFamilies.map(f => f.id === familyId ? { ...f, ipSerialNo: newSerial } : f));
    
    api.updateFamily(selectedYear, selectedMonth, selectedUpaBial, familyId, { ipSerialNo: newSerial })
        .catch(() => {
            setError("Failed to update serial number. Reverting.");
            setFamilies(originalFamilies);
        });
  }, [selectedYear, selectedMonth, selectedUpaBial, families]);

  const handleOpenTitheModal = (family: Family) => setFamilyForModal(family);
  const handleCloseTitheModal = () => setFamilyForModal(null);

  const handleSaveTitheModal = useCallback((familyId: string, newTithe: Tithe) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial) return;

    setFamilies(prevFamilies => {
        const newFamilies = prevFamilies.map(f => f.id === familyId ? { ...f, tithe: newTithe } : f);
        
        setError(null);
        api.updateFamily(selectedYear, selectedMonth, selectedUpaBial, familyId, { tithe: newTithe })
            .catch(() => {
                setError("Failed to save tithe details. Reverting.");
                setFamilies(prevFamilies);
            });

        return newFamilies;
    });

    handleCloseTitheModal();
  }, [selectedYear, selectedMonth, selectedUpaBial]);
  
  const handleBackFromTitheTable = useCallback(() => {
    setSelectedMonth(null);
  }, []);


  const renderContent = () => {
    if (error) {
        return <div className="text-center p-8 bg-red-100 text-red-700 rounded-lg">{error}</div>
    }
    
    if (view === 'report') {
        if (isLoading) return <LoadingSpinner message="Generating Monthly Report..." />;
        if (monthlyReportData && selectedYear && selectedMonth) {
            return <AggregateReport 
                      data={monthlyReportData}
                      upaBials={UPA_BIALS}
                      month={selectedMonth}
                      year={selectedYear}
                      onBack={() => setView('entry')}
                      onGoToDashboard={clearSelections}
                    />;
        }
        return null;
    }

    if (view === 'yearlyReport') {
        if (isLoading) return <LoadingSpinner message="Generating Yearly Report..." />;
        if (yearlyReportData && selectedYear) {
            return <YearlyReport
                      data={yearlyReportData}
                      upaBials={UPA_BIALS}
                      year={selectedYear}
                      onBack={() => setView('entry')}
                      onGoToDashboard={clearSelections}
                    />;
        }
        return null;
    }
    
    // Admin Flow
    if (!assignedBial) {
        if (!selectedUpaBial) {
            return <UpaBialSelection 
                        upaBials={UPA_BIALS}
                        onSelectBial={setSelectedUpaBial}
                        onGoToDashboard={clearSelections}
                    />;
        }
        if (!selectedYear) {
            return <YearSelection 
                        years={YEARS} 
                        onSelectYear={setSelectedYear} 
                        onBack={() => setSelectedUpaBial(null)}
                    />;
        }
        if (!selectedMonth) {
            return <MonthSelection
                        months={MONTHS} 
                        year={selectedYear} 
                        onSelectMonth={setSelectedMonth} 
                        onBack={() => setSelectedYear(null)}
                        onViewYearlyReport={() => setView('yearlyReport')}
                        onGoToDashboard={clearSelections}
                    />;
        }
    } 
    // Restricted User Flow
    else {
        if (!selectedUpaBial) {
            return <LoadingSpinner message={`Loading your dashboard for ${assignedBial}...`} />;
        }
        if (!selectedYear) {
            return <YearSelection 
                        years={YEARS} 
                        onSelectYear={setSelectedYear} 
                    />;
        }
        if (!selectedMonth) {
            return <MonthSelection 
                        months={MONTHS} 
                        year={selectedYear} 
                        onSelectMonth={setSelectedMonth} 
                        onBack={() => setSelectedYear(null)}
                        onViewYearlyReport={() => setView('yearlyReport')}
                        onGoToDashboard={clearSelections}
                    />;
        }
    }


    // Tithe Entry View
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center">
                    <button onClick={handleBackFromTitheTable} className="p-2 rounded-full hover:bg-slate-200 transition-colors mr-2 sm:mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        <span className="sr-only">Back to Previous Step</span>
                    </button>
                    <div className="text-sm sm:text-base text-slate-600">
                        <span
                            className={!assignedBial ? "cursor-pointer hover:underline" : ""}
                            onClick={() => {
                                if (!assignedBial) {
                                    setSelectedYear(null);
                                    setSelectedMonth(null);
                                }
                            }}
                        >
                            {selectedUpaBial}
                        </span>
                        <span className="mx-1 sm:mx-2">/</span>
                        <span
                            className="cursor-pointer hover:underline"
                            onClick={() => { setSelectedMonth(null); setView('entry'); }}
                        >
                            {selectedYear}
                        </span>
                        <span className="mx-1 sm:mx-2">/</span>
                        <span className="font-bold text-slate-800">{selectedMonth}</span>
                    </div>
                </div>
                 <button 
                    onClick={clearSelections} 
                    className="flex items-center gap-2 bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all text-sm"
                    aria-label="Back to Dashboard"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <span className="hidden sm:inline">Dashboard</span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start mb-8">
                <div className="flex-grow w-full">
                    <AddFamilyForm onAddFamily={handleAddFamily} />
                </div>
                <ImportFamilies onImport={handleImportFamilies} />
                <button
                    onClick={() => setView('report')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
                >
                    View Monthly Report
                </button>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                    Tithe Records
                </h2>
                <TitheTable
                    families={families}
                    isLoading={isLoading}
                    onTitheChange={handleTitheChange}
                    onRemoveFamily={handleRemoveFamily}
                    onUpdateFamilyName={handleUpdateFamilyName}
                    onUpdateIpSerialNo={handleUpdateIpSerialNo}
                    onOpenTitheModal={handleOpenTitheModal}
                />
            </div>
        </>
    );
  };


  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header onLogout={onLogout} />
        <main className="mt-8">
          <div className="bg-sky-50 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 min-h-[50vh]">
            {renderContent()}
          </div>
        </main>
        <footer className="text-center mt-12 text-slate-500 text-sm">
            <p>Tithe Calculator &copy; {new Date().getFullYear()}. All rights reserved.</p>
        </footer>
      </div>
      {familyForModal && (
        <TitheModal 
            family={familyForModal}
            onClose={handleCloseTitheModal}
            onSave={handleSaveTitheModal}
        />
      )}
    </>
  );
};

export default App;
