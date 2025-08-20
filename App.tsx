
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

const ExportIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM13 12.67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/>
    </svg>
);

const PdfIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm-6.5-2H9v1.5h.5c.28 0 .5-.22.5-.5v-.5zm5 0h-1.5v1.5H15v-1c0-.28-.22-.5-.5-.5zM4 6H2v14c0 1.1.9 2 2 2h14v-2-H4V6z"/>
    </svg>
);

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

  const handleClearTithe = useCallback((familyId: string) => {
    if (!selectedYear || !selectedMonth || !selectedUpaBial) return;

    const newTithe: Tithe = { pathianRam: 0, ramthar: 0, tualchhung: 0 };

    setFamilies(prevFamilies => {
        const newFamilies = prevFamilies.map(f => f.id === familyId ? { ...f, tithe: newTithe } : f);
        
        setError(null);
        api.updateFamily(selectedYear, selectedMonth, selectedUpaBial, familyId, { tithe: newTithe })
            .catch(() => {
                setError("Failed to clear tithe details. Reverting.");
                setFamilies(prevFamilies);
            });

        return newFamilies;
    });
  }, [selectedYear, selectedMonth, selectedUpaBial]);
  
  const handleBackFromTitheTable = useCallback(() => {
    setSelectedMonth(null);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(value);
  };

  const handleExportBialExcel = () => {
        if (!selectedYear || !selectedMonth || !selectedUpaBial || families.length === 0) return;

        const dataToExport = families.map(family => ({
            'Chhungkua': family.name,
            'S/N': family.ipSerialNo ?? 'N/A',
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
            'Chhungkua': 'Grand Total',
            'S/N': '',
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
        autoTable(doc, {
            body: [[`Tithe Details for ${selectedUpaBial}`], [`${selectedMonth} ${selectedYear}`]],
            theme: 'plain',
            styles: { fontSize: 12, halign: 'center' },
        });

        const head = [['Chhungkua', 'S/N', 'Pathian Ram', 'Ramthar', 'Tualchhung', 'Total']];
        const body = families.map(f => [
            f.name,
            f.ipSerialNo ?? 'N/A',
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
            'Grand Total',
            '',
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
            headStyles: { fillColor: [241, 245, 249], textColor: [48, 63, 84], fontStyle: 'bold' },
            footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
            styles: { halign: 'right' },
            columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left' } },
        });

        doc.save(`Tithe_Details_${selectedUpaBial.replace(/ /g, '_')}_${selectedMonth}_${selectedYear}.pdf`);
    };


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

            <div className="flex flex-col sm:flex-row gap-4 items-start mb-8 flex-wrap">
                <div className="flex-grow w-full sm:w-auto">
                    <AddFamilyForm onAddFamily={handleAddFamily} />
                </div>
                <ImportFamilies onImport={handleImportFamilies} />
                <button
                    onClick={() => setView('report')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-md"
                >
                    View Aggregate Report
                </button>
                 <button
                    onClick={handleExportBialExcel}
                    disabled={families.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    <ExportIcon className="w-5 h-5" />
                    Export Excel (This Bial)
                </button>
                 <button
                    onClick={handleExportBialPdf}
                    disabled={families.length === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    <PdfIcon className="w-5 h-5" />
                    Export PDF (This Bial)
                </button>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                    Pathian Ram
                </h2>
                <TitheTable
                    families={families}
                    isLoading={isLoading}
                    onTitheChange={handleTitheChange}
                    onRemoveFamily={handleRemoveFamily}
                    onUpdateFamilyName={handleUpdateFamilyName}
                    onUpdateIpSerialNo={handleUpdateIpSerialNo}
                    onOpenTitheModal={handleOpenTitheModal}
                    onClearTithe={handleClearTithe}
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
