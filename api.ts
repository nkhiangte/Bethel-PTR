// api.ts - Local Storage version
import type { Family, Tithe, AggregateReportData, FamilyYearlyTitheData, YearlyFamilyTotal, FamilyWithTithe } from './types.ts';

// --- CONFIGURATION ---
const STORAGE_KEY = 'bethel_kohhran_data_local';
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// --- IN-MEMORY DATA CACHE ---
interface AppData {
    families: StoredFamily[];
    tithes: StoredTitheLog[];
}

let appData: AppData = { families: [], tithes: [] };
let isInitialized = false;

// --- DATA TYPES for storage (internal) ---
interface StoredFamily extends Omit<Family, 'id'> {
    id: string;
    createdAt: string;
}
interface StoredTitheLog {
    id: string;
    year: number;
    month: string;
    familyId: string;
    upaBial: string;
    tithe: Tithe;
}

// --- INITIALIZATION and SYNC ---
export const initializeApi = (): void => {
    if (isInitialized) return;
    
    const content = localStorage.getItem(STORAGE_KEY);
    
    if (content && content.trim()) {
        try {
            appData = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse local data, starting fresh.", e);
            appData = { families: [], tithes: [] };
        }
    } else {
        // If storage is new/empty, initialize with default structure
        appData = { families: [], tithes: [] };
        _saveDataToLocalStorage();
    }
    
    isInitialized = true;
};

const _saveDataToLocalStorage = (): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
        console.error("Failed to save data to local storage", e);
        alert("Error: Could not save data. Your browser's local storage might be full.");
    }
};


// --- DATA API ---

export const fetchFamilies = async (year: number, month: string, upaBial: string): Promise<FamilyWithTithe[]> => {
    const relevantTitheLogs = appData.tithes.filter(log => 
        log.year === year && log.month === month && log.upaBial === upaBial
    );

    if (relevantTitheLogs.length === 0) return [];

    const familiesMap = new Map<string, StoredFamily>(appData.families.map(f => [f.id, f]));

    const familiesWithTithe = relevantTitheLogs.map(log => {
        const family = familiesMap.get(log.familyId);
        if (!family) return null;
        
        return {
            id: family.id,
            name: family.name,
            ipSerialNo: family.ipSerialNo,
            tithe: log.tithe,
        };
    }).filter((f): f is FamilyWithTithe => f !== null)
      .sort((a, b) => (a.ipSerialNo ?? Infinity) - (b.ipSerialNo ?? Infinity));

    return familiesWithTithe;
};

export const addFamily = async (year: number, upaBial: string, name: string): Promise<void> => {
    const trimmedName = name.trim();

    const existingFamily = appData.families.find(f => f.name.toLowerCase() === trimmedName.toLowerCase() && f.currentBial === upaBial);
    if (existingFamily) {
        throw new Error(`Family "${trimmedName}" already exists in ${upaBial}.`);
    }

    const newFamilyId = crypto.randomUUID();
    const newFamily: StoredFamily = {
        id: newFamilyId,
        name: trimmedName,
        ipSerialNo: null,
        currentBial: upaBial,
        createdAt: new Date().toISOString(),
    };
    appData.families.push(newFamily);

    const defaultTithe: Tithe = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
    MONTHS.forEach(month => {
        const newTitheLog: StoredTitheLog = {
            id: crypto.randomUUID(),
            year,
            month,
            upaBial,
            familyId: newFamilyId,
            tithe: defaultTithe
        };
        appData.tithes.push(newTitheLog);
    });
    
    _saveDataToLocalStorage();
};

export const importFamilies = async (year: number, upaBial: string, names: string[]): Promise<{added: number, skipped: number}> => {
    const existingNames = new Set(appData.families.filter(f => f.currentBial === upaBial).map(f => f.name.trim().toLowerCase()));
    
    const uniqueNamesToImport = [...new Set(names.map(name => name.trim()).filter(Boolean))];
    let addedCount = 0;
    let skippedCount = 0;

    uniqueNamesToImport.forEach(name => {
        if (existingNames.has(name.toLowerCase())) {
            skippedCount++;
        } else {
            const newFamilyId = crypto.randomUUID();
            const newFamily: StoredFamily = {
                id: newFamilyId,
                name,
                ipSerialNo: null,
                currentBial: upaBial,
                createdAt: new Date().toISOString(),
            };
            appData.families.push(newFamily);

            const defaultTithe: Tithe = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
            MONTHS.forEach(month => {
                const newTitheLog: StoredTitheLog = {
                    id: crypto.randomUUID(),
                    year, month, upaBial, familyId: newFamilyId, tithe: defaultTithe
                };
                appData.tithes.push(newTitheLog);
            });
            addedCount++;
            existingNames.add(name.toLowerCase());
        }
    });

    if (addedCount > 0) {
        _saveDataToLocalStorage();
    }
    
    return { added: addedCount, skipped: skippedCount };
};

export const updateFamily = async (year: number, month: string, upaBial: string, familyId: string, updatedData: Partial<Family & {tithe: Tithe}>): Promise<void> => {
    let changed = false;
    
    if ('name' in updatedData || 'ipSerialNo' in updatedData) {
        const familyIndex = appData.families.findIndex(f => f.id === familyId);
        if (familyIndex !== -1) {
            if ('name' in updatedData) {
                const newName = updatedData.name!.trim();
                const duplicate = appData.families.find(f => f.id !== familyId && f.name.toLowerCase() === newName.toLowerCase() && f.currentBial === upaBial);
                if (duplicate) {
                    throw new Error(`Another family with the name "${newName}" already exists.`);
                }
                appData.families[familyIndex].name = newName;
                changed = true;
            }
            if ('ipSerialNo' in updatedData) {
                appData.families[familyIndex].ipSerialNo = updatedData.ipSerialNo!;
                changed = true;
            }
        }
    }

    if ('tithe' in updatedData) {
        const titheIndex = appData.tithes.findIndex(log => 
            log.year === year && log.month === month && log.familyId === familyId
        );
        if (titheIndex !== -1) {
            appData.tithes[titheIndex].tithe = updatedData.tithe!;
            changed = true;
        } else {
            const newTitheLog: StoredTitheLog = {
                id: crypto.randomUUID(),
                year, month, upaBial, familyId, tithe: updatedData.tithe!
            };
            appData.tithes.push(newTitheLog);
            changed = true;
        }
    }

    if (changed) {
        _saveDataToLocalStorage();
    }
};

export const removeFamily = async (familyId: string): Promise<void> => {
    appData.families = appData.families.filter(f => f.id !== familyId);
    appData.tithes = appData.tithes.filter(log => log.familyId !== familyId);
    _saveDataToLocalStorage();
};

export const transferFamily = async (familyId: string, destinationUpaBial: string): Promise<void> => {
    const familyIndex = appData.families.findIndex(f => f.id === familyId);
    if (familyIndex !== -1) {
        appData.families[familyIndex].currentBial = destinationUpaBial;
    }

    appData.tithes.forEach(log => {
        if (log.familyId === familyId) {
            log.upaBial = destinationUpaBial;
        }
    });

    _saveDataToLocalStorage();
};


// --- REPORTING API ---
export const fetchMonthlyReport = async (year: number, month: string): Promise<AggregateReportData> => {
    const report: AggregateReportData = {};
    const filteredLogs = appData.tithes.filter(log => log.year === year && log.month === month);

    filteredLogs.forEach(log => {
        const { upaBial, tithe } = log;
        if (!report[upaBial]) {
            report[upaBial] = { pathianRam: 0, ramthar: 0, tualchhung: 0, total: 0 };
        }
        report[upaBial].pathianRam += tithe.pathianRam;
        report[upaBial].ramthar += tithe.ramthar;
        report[upaBial].tualchhung += tithe.tualchhung;
        report[upaBial].total += tithe.pathianRam + tithe.ramthar + tithe.tualchhung;
    });
    return report;
};

export const fetchYearlyReport = async (year: number): Promise<AggregateReportData> => {
    const report: AggregateReportData = {};
    const filteredLogs = appData.tithes.filter(log => log.year === year);
    
    filteredLogs.forEach(log => {
        const { upaBial, tithe } = log;
        if (!report[upaBial]) {
            report[upaBial] = { pathianRam: 0, ramthar: 0, tualchhung: 0, total: 0 };
        }
        report[upaBial].pathianRam += tithe.pathianRam;
        report[upaBial].ramthar += tithe.ramthar;
        report[upaBial].tualchhung += tithe.tualchhung;
        report[upaBial].total += tithe.pathianRam + tithe.ramthar + tithe.tualchhung;
    });
    return report;
};

export const fetchFamilyYearlyData = async (year: number, familyId: string): Promise<{ data: FamilyYearlyTitheData, familyInfo: { name: string, ipSerialNo: number | null, upaBial: string } }> => {
    const family = appData.families.find(f => f.id === familyId);
    if (!family) {
        throw new Error("Family not found.");
    }

    const familyInfo = { name: family.name, ipSerialNo: family.ipSerialNo, upaBial: family.currentBial };

    const yearlyData: FamilyYearlyTitheData = {};
    MONTHS.forEach(month => {
        yearlyData[month] = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
    });
    
    const familyLogs = appData.tithes.filter(log => log.year === year && log.familyId === familyId);

    familyLogs.forEach(log => {
        yearlyData[log.month] = log.tithe;
    });

    return { data: yearlyData, familyInfo };
};

export const fetchBialYearlyFamilyData = async (year: number, upaBial: string): Promise<YearlyFamilyTotal[]> => {
    const bialFamilies = appData.families.filter(f => f.currentBial === upaBial);
    if (bialFamilies.length === 0) return [];
    
    const familyTotals = new Map<string, YearlyFamilyTotal>();
    bialFamilies.forEach(f => {
        familyTotals.set(f.id, {
            id: f.id, name: f.name, ipSerialNo: f.ipSerialNo,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 },
        });
    });

    const yearLogs = appData.tithes.filter(log => log.year === year);

    yearLogs.forEach(log => {
        const family = familyTotals.get(log.familyId);
        if (family) {
            family.tithe.pathianRam += log.tithe.pathianRam;
            family.tithe.ramthar += log.tithe.ramthar;
            family.tithe.tualchhung += log.tithe.tualchhung;
        }
    });

    return Array.from(familyTotals.values()).sort((a, b) => (a.ipSerialNo ?? Infinity) - (b.ipSerialNo ?? Infinity));
};
