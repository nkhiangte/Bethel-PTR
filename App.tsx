import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AddFamilyForm } from './components/AddFamilyForm.tsx';
import { Header } from './components/Header.tsx';
import { TitheTable } from './components/TitheTable.tsx';
import { ImportFamilies } from './components/ImportFamilies.tsx';
import { TitheModal } from './components/TitheModal.tsx';
import { TransferFamilyModal } from './components/TransferFamilyModal.tsx';
import { AggregateReport } from './components/AggregateReport.tsx';
import { YearSelection } from './components/YearSelection.tsx';
import { MonthSelection } from './components/MonthSelection.tsx';
import { UpaBialSelection } from './components/UpaBialSelection.tsx';
import { YearlyReport } from './components/YearlyReport.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import { FamilyYearlyReport } from './components/FamilyYearlyReport.tsx';
import { BialYearlyFamilyReport } from './components/BialYearlyFamilyReport.tsx';
import { UserManagement } from './components/UserManagement.tsx';
import { UpaBialSettings } from './components/BialManagement.tsx';
import { AllFamiliesManagement } from './components/AllFamiliesManagement.tsx'; 
import { ImportContributionsModal } from './components/ImportContributionsModal.tsx';
import { SearchBar } from './components/SearchBar.tsx';
import { InstallPWAButton } from './components/InstallPWAButton.tsx';
import * as api from './api.ts';
import type { Family, TitheCategory, Tithe, AggregateReportData, FamilyWithTithe, User, BialInfo } from './types.ts';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

interface AppProps {
    user: User;
    onLogout: () => void;
}

// Helper to safely access localStorage
const getStorageItem = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    try {
        return JSON.parse(item);
    } catch {
        return defaultValue;
    }
};

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


export const App: React.FC<AppProps> = ({ user, onLogout }) => {
  const { assignedBial, isAdmin } = user;
  
  const [upaBials, setUpaBials] = useState<string[]>([]);
  const [currentYearBials, setCurrentYearBials] = useState<string[]>([]);
  const [isLoadingBials, setIsLoadingBials] = useState(false);
  
  // Initialize state from localStorage where appropriate to persist across refreshes
  const [selectedYear, setSelectedYear] = useState<number | null>(() => getStorageItem('selectedYear', null));
  const [selectedMonth, setSelectedMonth] = useState<string | null>(() => getStorageItem('selectedMonth', null));
  const [selectedUpaBial, setSelectedUpaBial] = useState<string | null>(() => assignedBial || getStorageItem('selectedUpaBial', null));
  
  const [families, setFamilies] = useState<FamilyWithTithe[]>([]);
  const [monthlyReportData, setMonthlyReportData] = useState<AggregateReportData | null>(null);
  const [yearlyReportData, setYearlyReportData] = useState<AggregateReportData | null>(null);
  const [currentBialInfo, setCurrentBialInfo] = useState<BialInfo | null>(null);
  
  const [familyForModal, setFamilyForModal] = useState<FamilyWithTithe | null>(null);
  const [familyToTransfer, setFamilyToTransfer] = useState<Family | null>(null); 
  const [familyForReport, setFamilyForReport] = useState<{id: string; name: string} | null>(null);
  
  // View state: fallback to 'entry' if stored view depends on missing transient data (like reports)
  const [view, setView] = useState<'entry' | 'report' | 'yearlyReport' | 'familyReport' | 'bialYearlyReport' | 'userManagement' | 'upaBialSettings' | 'allFamiliesManagement'>(() => {
    const storedView = getStorageItem('currentView', 'entry');
    const independentViews = ['entry', 'userManagement', 'upaBialSettings', 'allFamiliesManagement'];
    // If the stored view requires data that isn't persisted (reports), revert to entry to avoid blank screens
    if (independentViews.includes(storedView)) return storedView;
    return 'entry';
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImportContributionsModalOpen, setIsImportContributionsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isYearExplicitlyArchived, setIsYearExplicitlyArchived] = useState<boolean>(false);

  const [sortBy, setSortBy] = useState<'name' | 'serial' | null>(null); 
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');


  // Persist selections to localStorage
  useEffect(() => {
    if (selectedYear) localStorage.setItem('selectedYear', JSON.stringify(selectedYear));
    else localStorage.removeItem('selectedYear');
  }, [selectedYear]);

  useEffect(() => {
    if (selectedMonth) localStorage.setItem('selectedMonth', JSON.stringify(selectedMonth));
    else localStorage.removeItem('selectedMonth');
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedUpaBial) localStorage.setItem('selectedUpaBial', JSON.stringify(selectedUpaBial));
    else localStorage.removeItem('selectedUpaBial');
  }, [selectedUpaBial]);

  useEffect(() => {
    localStorage.setItem('currentView', JSON.stringify(view));
  }, [view]);

  // Ensure assignedBial is respected if user profile loads/changes
  useEffect(() => {
    if (assignedBial) {
        setSelectedUpaBial(assignedBial);
    }
  }, [assignedBial]);


  const clearSelections = useCallback(() => {
    setSelectedYear(null);
    setSelectedMonth(null);
    if (!assignedBial) setSelectedUpaBial(null);
    setFamilies([]);
    setMonthlyReportData(null);
    setYearlyReportData(null);
    setFamilyForReport(null);
    setCurrentBialInfo(null);
    setView('entry');
    setError(null);
    setSearchTerm('');
    setIsYearExplicitlyArchived(false); 
    setSortBy(null); 
    setSortOrder('asc'); 

    // Clear localStorage
    localStorage.removeItem('selectedYear');
    localStorage.removeItem('selectedMonth');
    localStorage.removeItem('selectedUpaBial');
    localStorage.removeItem('currentView');
  }, [assignedBial]);

  useEffect(() => {
    const loadCurrentYearBials = async () => {
        try {
            const fetchedBials = await api.fetchUpaBials(currentYear);
            setCurrentYearBials(fetchedBials);
        } catch (e) {
            console.error("Failed to fetch Upa Bials list for current year", e);
        }
    };
    loadCurrentYearBials();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      const loadYearData = async () => {
        setIsLoadingBials(true);
        try {
            const [fetchedBials, archivedStatus] = await Promise.all([
                api.fetchUpaBials(selectedYear),
                api.fetchArchiveStatus(selectedYear)
            ]);
            setUpaBials(fetchedBials);
            setIsYearExplicitlyArchived(archivedStatus);
        } catch (e) {
            console.error(`Failed to load year data:`, e);
        } finally {
            setIsLoadingBials(false);
        }
      };
      loadYearData();
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedYear && selectedMonth && selectedUpaBial) {
      const fetchFam = async () => {
        setIsLoading(true);
        try {
          const fetchedFamilies = await api.fetchFamilies(selectedYear, selectedMonth, selectedUpaBial);
          setFamilies(fetchedFamilies);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchFam();
    }
  }, [selectedYear, selectedMonth, selectedUpaBial]);

  const isDataEntryLocked = useMemo(() => {
    if (selectedYear === null) return false;
    return selectedYear < currentYear || isYearExplicitlyArchived;
  }, [selectedYear, currentYear, isYearExplicitlyArchived]);

  const handleAddFamily = useCallback(async (name: string) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial || isDataEntryLocked) return;
    setIsLoading(true);
    try {
      await api.addFamily(selectedYear, selectedMonth, selectedUpaBial, name.trim());
      const updatedFamilies = await api.fetchFamilies(selectedYear, selectedMonth, selectedUpaBial);
      setFamilies(updatedFamilies);
    } catch (e: any) {
      alert(e.message || 'Failed to add family.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedUpaBial, isDataEntryLocked]);

  const handleImportFamilies = useCallback(async (familiesToImport: { name: string; ipSerialNo: number | null }[], onResult: (message: string) => void) => {
    if (!selectedYear || !selectedUpaBial || isDataEntryLocked) return;
    setIsLoading(true);
    try {
        const { added, skipped, reactivated } = await api.importFamilies(selectedYear, selectedUpaBial, familiesToImport);
        let message = '';
        if (added > 0) message += `${added} new families added. `;
        if (reactivated > 0) message += `${reactivated} previously unassigned families reactivated. `;
        if (skipped > 0) message += `${skipped} families skipped (already in this Bial).`;
        
        if (!message) message = 'No changes made.';
        
        onResult(message);
        if (selectedMonth) {
            const updated = await api.fetchFamilies(selectedYear, selectedMonth, selectedUpaBial);
            setFamilies(updated);
        }
    } catch (e) {
        alert('Import failed.');
    } finally {
        setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedUpaBial, isDataEntryLocked]);

  const handleTitheChange = useCallback(async (familyId: string, category: TitheCategory, value: number) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial || isDataEntryLocked) return;
    setFamilies(prev => prev.map(f => f.id === familyId ? { ...f, tithe: { ...f.tithe, [category]: value } } : f));
    await api.updateTithe(selectedYear, selectedMonth, selectedUpaBial, familyId, category, value);
  }, [selectedYear, selectedMonth, selectedUpaBial, isDataEntryLocked]);
  
  const handleRemoveFamily = useCallback(async (familyId: string, year: number) => {
    if (isDataEntryLocked) return;
    setFamilies(prev => prev.filter(f => f.id !== familyId));
    await api.removeFamily(familyId, year);
  }, [isDataEntryLocked]);

  const handleBulkRemoveFamilies = useCallback(async (familyIds: string[]) => {
    if (!selectedYear || isDataEntryLocked) return;
    setIsLoading(true);
    try {
        await api.bulkRemoveFamilies(familyIds, selectedYear);
        setFamilies(prev => prev.filter(f => !familyIds.includes(f.id)));
    } catch (e) {
        alert('Failed to delete selected records.');
    } finally {
        setIsLoading(false);
    }
  }, [selectedYear, isDataEntryLocked]);

  const handleUnassignFamily = useCallback(async (familyId: string) => {
    if (isDataEntryLocked) return;
    setFamilies(prev => prev.filter(f => f.id !== familyId));
    await api.unassignFamilyFromBial(familyId);
  }, [isDataEntryLocked]);

  const handleOpenTitheModal = (family: FamilyWithTithe) => setFamilyForModal(family);
  const handleCloseTitheModal = () => setFamilyForModal(null);

  const handleSaveTitheModal = useCallback(async (familyId: string, newTithe: Tithe) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial || isDataEntryLocked) return;
    setFamilies(prev => prev.map(f => f.id === familyId ? { ...f, tithe: newTithe } : f));
    await api.updateTithe(selectedYear, selectedMonth, selectedUpaBial, familyId, newTithe);
    handleCloseTitheModal();
  }, [selectedYear, selectedMonth, selectedUpaBial, isDataEntryLocked]);

  const handleTransferFamily = useCallback(async (familyId: string, destinationBial: string) => {
    setIsLoading(true);
    try {
        await api.transferFamily(familyId, destinationBial);
        if (selectedUpaBial && selectedUpaBial !== destinationBial) {
            setFamilies(prev => prev.filter(f => f.id !== familyId));
        }
        setFamilyToTransfer(null);
    } catch (e: any) {
        alert('Transfer failed.');
    } finally {
        setIsLoading(false);
    }
  }, [selectedUpaBial]);
  
  const handleClearTithe = useCallback(async (familyId: string) => {
      if (!selectedYear || !selectedMonth || !selectedUpaBial || isDataEntryLocked) return;
      
      const zeroTithe = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
      setFamilies(prev => prev.map(f => f.id === familyId ? { ...f, tithe: zeroTithe } : f));
      await api.updateTithe(selectedYear, selectedMonth, selectedUpaBial, familyId, zeroTithe);
  }, [selectedYear, selectedMonth, selectedUpaBial, isDataEntryLocked]);

  const handleSort = (criteria: 'name' | 'serial') => {
    if (sortBy === criteria) {
        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
        setSortBy(criteria);
        setSortOrder('asc'); 
    }
  };

  const filteredFamilies = useMemo(() => {
    let result = families.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortBy === 'name') {
        result.sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    } else if (sortBy === 'serial') {
        result.sort((a, b) => sortOrder === 'asc' ? (a.ipSerialNo ?? 9999) - (b.ipSerialNo ?? 9999) : (b.ipSerialNo ?? 9999) - (a.ipSerialNo ?? 9999));
    }
    return result;
  }, [families, searchTerm, sortBy, sortOrder]);

  const renderContent = () => {
    if (view === 'report' && monthlyReportData) return <AggregateReport data={monthlyReportData} upaBials={upaBials} month={selectedMonth!} year={selectedYear!} onBack={() => setView('entry')} onGoToDashboard={clearSelections} />;
    if (view === 'yearlyReport' && yearlyReportData) return <YearlyReport data={yearlyReportData} upaBials={upaBials} year={selectedYear!} onBack={() => setView('entry')} onGoToDashboard={clearSelections} />;
    if (view === 'familyReport' && familyForReport) return <FamilyYearlyReport familyId={familyForReport.id} year={selectedYear!} onBack={() => setView('entry')} onGoToDashboard={clearSelections} />;
    if (view === 'bialYearlyReport') return <BialYearlyFamilyReport year={selectedYear!} upaBial={selectedUpaBial!} onBack={() => setView('entry')} onGoToDashboard={clearSelections} />;
    if (view === 'userManagement') return <UserManagement currentUser={user} upaBials={currentYearBials} onBack={() => setView('entry')} onGoToDashboard={clearSelections} />;
    if (view === 'upaBialSettings') return <UpaBialSettings onBack={() => setView('entry')} onGoToDashboard={clearSelections} currentYear={currentYear} years={YEARS} />;
    if (view === 'allFamiliesManagement') return <AllFamiliesManagement onBack={() => setView('entry')} onGoToDashboard={clearSelections} upaBials={currentYearBials} currentYear={currentYear} onOpenTransferModal={setFamilyToTransfer} />;

    if (!selectedYear) return <YearSelection years={YEARS} onSelectYear={setSelectedYear} />;
    if (isAdmin && !selectedUpaBial) return <UpaBialSelection upaBials={upaBials} onSelectBial={setSelectedUpaBial} onBack={() => setSelectedYear(null)} onGoToDashboard={clearSelections} />;
    if (!selectedMonth) return <MonthSelection months={MONTHS} year={selectedYear} currentYear={currentYear} onSelectMonth={setSelectedMonth} onBack={() => isAdmin ? setSelectedUpaBial(null) : setSelectedYear(null)} onGoToDashboard={clearSelections} onOpenImportModal={() => setIsImportContributionsModalOpen(true)} isDataEntryLocked={isDataEntryLocked} />;

    return (
        <div className="printable-area">
            <div className="mb-8 p-4 bg-sky-200/50 border border-sky-200 rounded-lg no-print flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedUpaBial} &ndash; {selectedMonth} {selectedYear}</h3>
                    <p className="text-slate-600">Thawhlawm chhunluhna</p>
                </div>
                <button onClick={() => setSelectedMonth(null)} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300">Back</button>
            </div>
            
            <div className="flex flex-col-reverse md:flex-row gap-6 mb-6 no-print">
                <div className="flex-grow">
                    <AddFamilyForm onAddFamily={handleAddFamily} isDisabled={isDataEntryLocked} />
                </div>
                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2">
                    <ImportFamilies onImport={handleImportFamilies} isDisabled={isDataEntryLocked} />
                    <button 
                        onClick={() => setIsImportContributionsModalOpen(true)} 
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-700 disabled:bg-slate-400" 
                        disabled={isDataEntryLocked}
                    >
                        <UploadIcon className="w-5 h-5"/> Contributions
                    </button>
                </div>
            </div>

            <div className="mb-4 no-print"><SearchBar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} /></div>
            <div className="flex gap-2 mb-4 no-print">
                <button onClick={() => handleSort('serial')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${sortBy === 'serial' ? 'bg-amber-600 text-white' : 'bg-slate-200'}`}>Sort by S/N {sortBy === 'serial' && (sortOrder === 'asc' ? '↑' : '↓')}</button>
                <button onClick={() => handleSort('name')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${sortBy === 'name' ? 'bg-amber-600 text-white' : 'bg-slate-200'}`}>Sort by Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</button>
            </div>
            <TitheTable
                families={filteredFamilies}
                isLoading={isLoading}
                onTitheChange={handleTitheChange}
                onRemoveFamily={handleRemoveFamily}
                onUnassignFamily={handleUnassignFamily}
                onBulkRemoveFamilies={handleBulkRemoveFamilies}
                onUpdateFamilyName={(id, name) => {
                    api.updateFamilyDetails(id, { name });
                    setFamilies(prev => prev.map(f => f.id === id ? { ...f, name } : f));
                }}
                onUpdateIpSerialNo={(id, s) => {
                    api.updateFamilyDetails(id, { ipSerialNo: s });
                    setFamilies(prev => prev.map(f => f.id === id ? { ...f, ipSerialNo: s } : f));
                }}
                onOpenTitheModal={handleOpenTitheModal}
                onOpenTransferModal={async (f) => { const full = await api.fetchFamilyById(f.id); if (full) setFamilyToTransfer(full); }}
                onClearTithe={handleClearTithe}
                onViewFamilyReport={f => { setFamilyForReport(f); setView('familyReport'); }}
                currentYear={currentYear}
                selectedYear={selectedYear!}
                isDataEntryLocked={isDataEntryLocked}
            />
            <div className="mt-8 flex justify-center gap-4 no-print">
                 <button onClick={() => setView('report')} className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700">Monthly Report</button>
                 <button onClick={() => setView('bialYearlyReport')} className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700">Bial Yearly Report</button>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-sky-50 font-sans text-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
         {/* Top bar with user info and logout */}
        <div className="flex flex-col sm:flex-row justify-end items-center mb-4 no-print gap-4">
             <div className="flex items-center gap-4 flex-wrap justify-center">
                <span className="text-slate-600 font-medium text-sm sm:text-base">
                    Hello, {user.displayName} {user.assignedBial ? `(${user.assignedBial})` : '(Admin)'}
                </span>
                
                {isAdmin && (
                    <div className="flex gap-2">
                         <button onClick={() => setView('userManagement')} className="text-xs sm:text-sm bg-indigo-100 text-indigo-700 px-2 py-1 sm:px-3 sm:py-1 rounded hover:bg-indigo-200 transition-colors">Users</button>
                         <button onClick={() => setView('upaBialSettings')} className="text-xs sm:text-sm bg-purple-100 text-purple-700 px-2 py-1 sm:px-3 sm:py-1 rounded hover:bg-purple-200 transition-colors">Settings</button>
                         <button onClick={() => setView('allFamiliesManagement')} className="text-xs sm:text-sm bg-teal-100 text-teal-700 px-2 py-1 sm:px-3 sm:py-1 rounded hover:bg-teal-200 transition-colors">All Families</button>
                    </div>
                )}
                 <InstallPWAButton />
                 <button onClick={onLogout} className="text-sm text-red-600 hover:text-red-800 underline">Logout</button>
             </div>
        </div>

        <Header onLogoClick={clearSelections} />
        
        <main className="mt-8">
             {renderContent()}
        </main>

         {familyForModal && (
            <TitheModal
                family={familyForModal}
                onClose={handleCloseTitheModal}
                onSave={handleSaveTitheModal}
                isYearLocked={isDataEntryLocked}
            />
        )}

        {familyToTransfer && (
            <TransferFamilyModal
               family={familyToTransfer}
               upaBials={currentYearBials}
               onClose={() => setFamilyToTransfer(null)}
               onTransfer={handleTransferFamily}
               isYearLocked={isDataEntryLocked}
            />
        )}
        
        {isImportContributionsModalOpen && selectedYear && (
            <ImportContributionsModal
                year={selectedYear}
                upaBials={currentYearBials}
                selectedBial={selectedUpaBial}
                onClose={() => setIsImportContributionsModalOpen(false)}
                onImport={api.importContributions}
                isYearLocked={isDataEntryLocked}
            />
        )}
      </div>
    </div>
  );
};