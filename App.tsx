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
import * as api from './api.ts';
import type { Family, TitheCategory, Tithe, AggregateReportData, FamilyWithTithe, User } from './types.ts';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const UPA_BIALS = Array.from({ length: 13 }, (_, i) => `Upa Bial ${i + 1}`);

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

interface AppProps {
    user: User;
    onLogout: () => void;
}

const ExportIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM13 12.67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
    </svg>
);

const PdfIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm-6.5-2H9v1.5h.5c.28 0 .5-.22.5-.5v-.5zm5 0h-1.5v1.5H15v-1c0-.28-.22-.5-.5zM4 6H2v14c0 1.1.9 2 2 2h14v-2-H4V6z"/>
    </svg>
);

const ReportIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
         <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    </svg>
);


const App: React.FC<AppProps> = ({ user, onLogout }) => {
  const { assignedBial, isAdmin } = user;
  
  // Handle new users who have not been assigned a role yet
  if (!isAdmin && !assignedBial) {
    return (
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <Header onLogoClick={() => {}} />
        <main className="mt-8 mb-24">
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="max-w-md w-full bg-sky-50 p-8 rounded-2xl shadow-lg border border-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="mt-6 text-2xl font-bold text-slate-800">Account Pending Approval</h2>
                <p className="mt-4 text-slate-600">
                    Your registration is successful. An administrator needs to approve your account and assign you a role before you can proceed.
                </p>
                <p className="mt-2 text-slate-500">
                    Please contact your administrator for assistance.
                </p>
            </div>
          </div>
        </main>
        <footer className="mt-12 text-center text-slate-500 text-sm no-print">
           <div className="flex items-center justify-center gap-4 mb-4">
               <span>Logged in as: <strong>{user.email}</strong> (Pending Approval)</span>
               <button
                   onClick={onLogout}
                   className="bg-slate-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
               >
                  Logout
               </button>
           </div>
           <p>Champhai Bethel Presbyterian Kohhran App. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedUpaBial, setSelectedUpaBial] = useState<string | null>(null);
  
  const [families, setFamilies] = useState<FamilyWithTithe[]>([]);
  const [monthlyReportData, setMonthlyReportData] = useState<AggregateReportData | null>(null);
  const [yearlyReportData, setYearlyReportData] = useState<AggregateReportData | null>(null);
  
  const [familyForModal, setFamilyForModal] = useState<FamilyWithTithe | null>(null);
  const [familyToTransfer, setFamilyToTransfer] = useState<FamilyWithTithe | null>(null);
  const [familyForReport, setFamilyForReport] = useState<{id: string; name: string} | null>(null);
  const [view, setView] = useState<'entry' | 'report' | 'yearlyReport' | 'familyReport' | 'bialYearlyReport' | 'userManagement'>('entry');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearSelections = useCallback(() => {
    // For Admins, reset everything to the top-level selection (Bial)
    if (isAdmin) {
        setSelectedYear(null);
        setSelectedMonth(null);
        setSelectedUpaBial(null);
        setFamilies([]);
        setMonthlyReportData(null);
        setYearlyReportData(null);
        setFamilyForReport(null);
        setView('entry');
        setError(null);
    } else {
        // For restricted users, the "dashboard" is the Month Selection for the chosen year.
        // So we only clear the month and subsequent data, keeping the year selected.
        setSelectedMonth(null);
        setFamilies([]);
        setMonthlyReportData(null);
        setFamilyForReport(null);
        setView('entry');
        setError(null);
    }
  }, [isAdmin]);

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
          console.error(e);
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
                console.error(e);
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
                console.error(e);
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
      await api.addFamily(selectedYear, selectedUpaBial, name.trim());
      const updatedFamilies = await api.fetchFamilies(selectedYear, selectedMonth, selectedUpaBial);
      setFamilies(updatedFamilies);
    } catch (e: any) {
      setError(e.message || 'Failed to add family.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedUpaBial]);

   const handleImportFamilies = useCallback(async (familiesToImport: { name: string; ipSerialNo: number | null }[], onResult: (message: string) => void) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial) return;
    setIsLoading(true);
    setError(null);
    try {
        const { added, skipped } = await api.importFamilies(selectedYear, selectedUpaBial, familiesToImport);
        
        let message = `${added} new families imported successfully!`;
        if (skipped > 0) {
            message += `\n${skipped} families were skipped because they already exist or were duplicates in the file.`;
        }
        onResult(message);

        const updatedFamilies = await api.fetchFamilies(selectedYear, selectedMonth, selectedUpaBial);
        setFamilies(updatedFamilies);
    } catch (e) {
        console.error(e);
        setError('Failed to import families.');
    } finally {
        setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedUpaBial]);

  const handleTitheChange = useCallback(async (familyId: string, category: TitheCategory, value: number) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial) return;
    
    // Optimistic UI update
    const updatedFamilies = families.map(f => {
        if (f.id === familyId) {
            return { ...f, tithe: { ...f.tithe, [category]: value } };
        }
        return f;
    });
    setFamilies(updatedFamilies);
    
    // Persist change
    await api.updateTithe(selectedYear, selectedMonth, selectedUpaBial, familyId, category, value);
  }, [selectedYear, selectedMonth, selectedUpaBial, families]);
  
  const handleRemoveFamily = useCallback(async (familyId: string) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial) return;

    // Optimistic UI update
    setFamilies(prevFamilies => prevFamilies.filter(f => f.id !== familyId));

    // Persist change
    await api.removeFamily(familyId);
  }, [selectedYear, selectedMonth, selectedUpaBial]);

  const handleUpdateFamilyName = useCallback(async (familyId: string, newName: string) => {
    if (newName.trim() === '' || !selectedYear || !selectedMonth || !selectedUpaBial) return;
    const trimmedName = newName.trim();

    setFamilies(prevFamilies => prevFamilies.map(f => f.id === familyId ? { ...f, name: trimmedName } : f));
    await api.updateFamilyDetails(familyId, { name: trimmedName });
  }, [selectedYear, selectedMonth, selectedUpaBial]);

  const handleUpdateIpSerialNo = useCallback(async (familyId: string, newSerial: number | null) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial) return;

    setFamilies(prevFamilies => prevFamilies.map(f => f.id === familyId ? { ...f, ipSerialNo: newSerial } : f));
    await api.updateFamilyDetails(familyId, { ipSerialNo: newSerial });
  }, [selectedYear, selectedMonth, selectedUpaBial]);

  const handleOpenTitheModal = (family: FamilyWithTithe) => setFamilyForModal(family);
  const handleCloseTitheModal = () => setFamilyForModal(null);

  const handleSaveTitheModal = useCallback(async (familyId: string, newTithe: Tithe) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial) return;

    setFamilies(prevFamilies => prevFamilies.map(f => f.id === familyId ? { ...f, tithe: newTithe } : f));
    await api.updateTithe(selectedYear, selectedMonth, selectedUpaBial, familyId, newTithe);
    handleCloseTitheModal();
  }, [selectedYear, selectedMonth, selectedUpaBial]);

  const handleClearTithe = useCallback(async (familyId: string) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial) return;

    const newTithe: Tithe = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
    setFamilies(prev => prev.map(f => (f.id === familyId ? { ...f, tithe: newTithe } : f)));
    await api.updateTithe(selectedYear, selectedMonth, selectedUpaBial, familyId, newTithe);
  }, [selectedYear, selectedMonth, selectedUpaBial]);

  const handleOpenTransferModal = (family: FamilyWithTithe) => setFamilyToTransfer(family);
  const handleCloseTransferModal = () => {
    setFamilyToTransfer(null);
    setError(null); // Clear any errors when closing the modal
  }

  const handleTransferFamily = useCallback(async (familyId: string, destinationBial: string) => {
    if (!selectedYear || !selectedUpaBial) return;

    setError(null);
    setIsLoading(true);

    try {
        await api.transferFamily(familyId, destinationBial);
        setFamilies(prev => prev.filter(f => f.id !== familyId));
        handleCloseTransferModal();
        alert(`Family has been successfully transferred to ${destinationBial}.`);
    } catch (e: any) {
        setError(e.message || 'Failed to transfer family.');
    } finally {
        setIsLoading(false);
    }
  }, [selectedYear, selectedUpaBial]);
  
  const handleBackFromTitheTable = useCallback(() => {
    setSelectedMonth(null);
  }, []);

  const handleViewFamilyReport = useCallback((family: {id: string, name: string}) => {
    if (selectedYear) {
        setFamilyForReport(family);
        setView('familyReport');
    }
  }, [selectedYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(value);
  };

  const handleExportBialExcel = () => {
        if (!selectedYear || !selectedMonth || !selectedUpaBial || families.length === 0) return;

        const dataToExport = families.map(family => ({
            'S/N': family.ipSerialNo ?? 'N/A',
            'Chhungkua': family.name,
            'Pathian Ram': family.tithe.pathianRam,
            'Ramthar': family.tithe.ramthar,
            'Tualchhung': family.tithe.tualchhung,
            'Total': family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung,
        }));
        
        const totals = families.reduce((acc, f) => {
            acc.pathianRam += f.tithe.pathianRam;
            acc.ramthar += f.tithe.ramthar;
            acc.tualchhung += f.tithe.tualchhung;
            acc.total += f.tithe.pathianRam + f.tithe.ramthar + f.tithe.tualchhung;
            return acc;
        }, { pathianRam: 0, ramthar: 0, tualchhung: 0, total: 0 });

        const footer = {
            'S/N': '',
            'Chhungkua': 'Grand Total',
            'Pathian Ram': totals.pathianRam,
            'Ramthar': totals.ramthar,
            'Tualchhung': totals.tualchhung,
            'Total': totals.total,
        };
        
        const worksheet = utils.json_to_sheet(dataToExport);
        utils.sheet_add_json(worksheet, [footer], { skipHeader: true, origin: -1 });

        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Tithe Details");

        writeFile(workbook, `Tithe_Details_${selectedUpaBial.replace(/ /g, '_')}_${selectedMonth}_${selectedYear}.xlsx`);
    };

    const handleExportBialPdf = () => {
        if (!selectedYear || !selectedMonth || !selectedUpaBial || families.length === 0) return;

        const doc = new jsPDF();
        const title = `${selectedUpaBial.replace('Upa ', '')} Pathian Ram`;
        autoTable(doc, {
            body: [[title], [`${selectedMonth} ${selectedYear}`]],
            theme: 'plain',
            styles: { fontSize: 12, halign: 'center' },
        });

        const head = [['S/N', 'Chhungkua', 'Pathian Ram', 'Ramthar', 'Tualchhung', 'Total']];
        const body = families.map(f => [
            f.ipSerialNo ?? 'N/A',
            f.name,
            formatCurrency(f.tithe.pathianRam),
            formatCurrency(f.tithe.ramthar),
            formatCurrency(f.tithe.tualchhung),
            formatCurrency(f.tithe.pathianRam + f.tithe.ramthar + f.tithe.tualchhung),
        ]);

        const totals = families.reduce((acc, f) => {
            acc.pathianRam += f.tithe.pathianRam;
            acc.ramthar += f.tithe.ramthar;
            acc.tualchhung += f.tithe.tualchhung;
            acc.total += f.tithe.pathianRam + f.tithe.ramthar + f.tithe.tualchhung;
            return acc;
        }, { pathianRam: 0, ramthar: 0, tualchhung: 0, total: 0 });

        const foot = [[
            '',
            'Grand Total',
            formatCurrency(totals.pathianRam),
            formatCurrency(totals.ramthar),
            formatCurrency(totals.tualchhung),
            formatCurrency(totals.total),
        ]];
        
        autoTable(doc, {
            head,
            body,
            foot,
            startY: (doc as any).lastAutoTable.finalY + 2,
            headStyles: { fillColor: [241, 245, 249], textColor: [48, 63, 84], fontStyle: 'bold', lineColor: [203, 213, 225], lineWidth: 0.1 },
            footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold', lineColor: [203, 213, 225], lineWidth: 0.1 },
            styles: { halign: 'right', lineColor: [203, 213, 225], lineWidth: 0.1 },
            columnStyles: { 
                0: { halign: 'left', cellWidth: 15 },
                1: { halign: 'left' }
            },
        });

        const monthAbbreviation = selectedMonth.substring(0, 3);
        const fileName = `PathianRam_${selectedUpaBial.replace(/ /g, '_')}_${monthAbbreviation}_${selectedYear}.pdf`;
        doc.save(fileName);
    };


  const renderContent = () => {
    if (error && !familyToTransfer) { // Only show main error if transfer modal isn't open
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

    if (view === 'familyReport') {
        if (familyForReport && selectedYear) {
            return <FamilyYearlyReport
                      familyId={familyForReport.id}
                      year={selectedYear}
                      onBack={() => { setView('entry'); setFamilyForReport(null); }}
                      onGoToDashboard={clearSelections}
                    />;
        }
        return null;
    }

    if (view === 'bialYearlyReport') {
        if (selectedYear && selectedUpaBial) {
            return <BialYearlyFamilyReport
                      year={selectedYear}
                      upaBial={selectedUpaBial}
                      onBack={() => setView('entry')}
                      onGoToDashboard={clearSelections}
                    />;
        }
        return null;
    }
    
    if (view === 'userManagement') {
        return <UserManagement 
                    currentUser={user}
                    upaBials={UPA_BIALS}
                    onBack={() => setView('entry')}
                    onGoToDashboard={clearSelections}
                />
    }

    // Admin Flow
    if (isAdmin) {
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
                        onGoToDashboard={clearSelections}
                    />;
        }
    }


    // Tithe Entry View
    return (
        <div className="printable-area">
            <div className="hidden print:block text-center mb-4">
                <h1 className="text-xl font-bold">{selectedUpaBial} - {selectedMonth} {selectedYear}</h1>
                <h2 className="text-lg">Pathian Ram Thawhlawm</h2>
            </div>

            <div className="mb-8 p-4 bg-sky-200/50 border border-sky-200 rounded-lg no-print">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex-grow">
                        <h3 className="text-xl font-bold text-slate-800">
                            {selectedUpaBial} &ndash; {selectedMonth} {selectedYear}
                        </h3>
                        <p className="text-slate-600">A hnuai ah hian chhungkaw tin te thawhlawm chhunglut rawh le.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                        <button
                            onClick={handleBackFromTitheTable}
                            className="bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors text-sm"
                            aria-label="Back to Month Selection"
                        >
                            &larr; Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col-reverse md:flex-row gap-6 mb-8 no-print">
                <div className="flex-grow">
                    <AddFamilyForm onAddFamily={handleAddFamily} />
                </div>
                <div>
                   <ImportFamilies onImport={handleImportFamilies} />
                </div>
            </div>

            <div className="bg-sky-50 rounded-lg shadow-md overflow-hidden border border-slate-200">
                <TitheTable
                    families={families}
                    isLoading={isLoading}
                    onTitheChange={handleTitheChange}
                    onRemoveFamily={handleRemoveFamily}
                    onUpdateFamilyName={handleUpdateFamilyName}
                    onUpdateIpSerialNo={handleUpdateIpSerialNo}
                    onOpenTitheModal={handleOpenTitheModal}
                    onOpenTransferModal={handleOpenTransferModal}
                    onClearTithe={handleClearTithe}
                    onViewFamilyReport={handleViewFamilyReport}
                />
            </div>

            {familyForModal && (
                <TitheModal 
                    family={familyForModal}
                    onClose={handleCloseTitheModal}
                    onSave={handleSaveTitheModal}
                />
            )}
            {familyToTransfer && selectedUpaBial && (
                <TransferFamilyModal
                    family={familyToTransfer}
                    upaBials={UPA_BIALS}
                    currentBial={selectedUpaBial}
                    onClose={handleCloseTransferModal}
                    onTransfer={handleTransferFamily}
                />
            )}
        </div>
    );
  }
  
  const showMonthlyActions = selectedYear && selectedMonth && selectedUpaBial && view === 'entry';
  const showYearlyActions = selectedYear && selectedUpaBial && !selectedMonth && view === 'entry';

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Header onLogoClick={clearSelections} />
       <main className="mt-8 mb-24">
        {renderContent()}
      </main>

      {/* Reports and Exports Section */}
      {(showMonthlyActions || showYearlyActions) && (
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md no-print border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">Reports & Exports</h3>
            <div className="flex flex-wrap justify-center items-center gap-4">
            
            {/* Yearly report buttons (shown on month selection screen) */}
            {showYearlyActions && (
                <>
                <button
                    onClick={() => setView('yearlyReport')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md"
                >
                    <ReportIcon className="w-5 h-5" />
                    <span>Aggregate Yearly Report</span>
                </button>
                <button
                    onClick={() => setView('bialYearlyReport')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all shadow-md"
                >
                    <ReportIcon className="w-5 h-5" />
                    <span>Bial Yearly Report</span>
                </button>
                </>
            )}

            {/* Monthly actions (shown on tithe entry screen) */}
            {showMonthlyActions && (
                <>
                 {isAdmin && (
                    <button 
                        onClick={() => setView('report')} 
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md"
                    >
                        <ReportIcon className="w-5 h-5" />
                        <span>Aggregate Monthly Report</span>
                    </button>
                )}
                <button onClick={handleExportBialPdf} className="flex items-center gap-2 bg-red-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-red-700 transition-all">
                    <PdfIcon className="w-5 h-5" />
                    <span>Export Monthly PDF</span>
                </button>
                <button onClick={handleExportBialExcel} className="flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-green-700 transition-all">
                    <ExportIcon className="w-5 h-5" />
                    <span>Export Monthly Excel</span>
                </button>
                </>
            )}
            </div>
        </div>
      )}

      <footer className="mt-12 text-center text-slate-500 text-sm no-print">
         <div className="flex items-center justify-center gap-4 mb-4">
             <span>Logged in as: <strong>{user.email}</strong> {user.isAdmin ? '(Admin)' : `(${user.assignedBial})`}</span>
              {isAdmin && view !== 'userManagement' && (
                 <button
                     onClick={() => setView('userManagement')}
                     className="bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all"
                 >
                    User Management
                 </button>
             )}
             <button
                 onClick={onLogout}
                 className="bg-slate-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
             >
                Logout
             </button>
         </div>
         <p>Champhai Bethel Presbyterian Kohhran App. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;