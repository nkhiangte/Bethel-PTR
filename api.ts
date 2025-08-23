// api.ts - LocalStorage version

import type { Family, Tithe, AggregateReportData, User, FamilyYearlyTitheData, YearlyFamilyTotal, FamilyWithTithe } from './types.ts';

// --- CONFIGURATION ---
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// --- LOCALSTORAGE HELPERS ---
const getFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key "${key}":`, error);
        return defaultValue;
    }
};

const saveToStorage = <T>(key: string, value: T): void => {
    try {
        const item = JSON.stringify(value);
        localStorage.setItem(key, item);
    } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
    }
};

// --- DATA INITIALIZATION ---
// Simple function to ensure there's some data to start with.
const initializeData = () => {    
    if (!localStorage.getItem('app_initialized')) {
        saveToStorage<User[]>('users', []);
        saveToStorage<Family[]>('families', []);
        saveToStorage<any[]>('tithes', []); // Use 'any' for simplicity of the log structure
        localStorage.setItem('app_initialized', 'true');
    }
};

initializeData();

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

// --- DATA API ---

export const fetchFamilies = async (year: number, month: string, upaBial: string): Promise<FamilyWithTithe[]> => {
    const allTitheLogs = getFromStorage<StoredTitheLog[]>('tithes', []);
    const allFamilies = getFromStorage<StoredFamily[]>('families', []);

    const relevantTitheLogs = allTitheLogs.filter(log => 
        log.year === year && log.month === month && log.upaBial === upaBial
    );

    if (relevantTitheLogs.length === 0) return [];

    const familiesMap = new Map<string, StoredFamily>(allFamilies.map(f => [f.id, f]));

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
    const families = getFromStorage<StoredFamily[]>('families', []);
    const titheLogs = getFromStorage<StoredTitheLog[]>('tithes', []);

    const existingFamily = families.find(f => f.name.toLowerCase() === trimmedName.toLowerCase() && f.currentBial === upaBial);
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
    families.push(newFamily);

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
        titheLogs.push(newTitheLog);
    });

    saveToStorage('families', families);
    saveToStorage('tithes', titheLogs);
};

export const importFamilies = async (year: number, upaBial: string, names: string[]): Promise<{added: number, skipped: number}> => {
    const families = getFromStorage<StoredFamily[]>('families', []);
    const titheLogs = getFromStorage<StoredTitheLog[]>('tithes', []);

    const existingNames = new Set(families.filter(f => f.currentBial === upaBial).map(f => f.name.trim().toLowerCase()));
    
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
            families.push(newFamily);

            const defaultTithe: Tithe = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
            MONTHS.forEach(month => {
                const newTitheLog: StoredTitheLog = {
                    id: crypto.randomUUID(),
                    year, month, upaBial, familyId: newFamilyId, tithe: defaultTithe
                };
                titheLogs.push(newTitheLog);
            });
            addedCount++;
            existingNames.add(name.toLowerCase()); // Avoid duplicates within the import list
        }
    });

    saveToStorage('families', families);
    saveToStorage('tithes', titheLogs);

    return { added: addedCount, skipped: skippedCount };
};

export const updateFamily = async (year: number, month: string, upaBial: string, familyId: string, updatedData: Partial<Family & {tithe: Tithe}>): Promise<void> => {
    const families = getFromStorage<StoredFamily[]>('families', []);
    const titheLogs = getFromStorage<StoredTitheLog[]>('tithes', []);

    // Update family document
    if ('name' in updatedData || 'ipSerialNo' in updatedData) {
        const familyIndex = families.findIndex(f => f.id === familyId);
        if (familyIndex !== -1) {
            if ('name' in updatedData) {
                const newName = updatedData.name!.trim();
                const duplicate = families.find(f => f.id !== familyId && f.name.toLowerCase() === newName.toLowerCase() && f.currentBial === upaBial);
                if (duplicate) {
                    throw new Error(`Another family with the name "${newName}" already exists.`);
                }
                families[familyIndex].name = newName;
            }
            if ('ipSerialNo' in updatedData) {
                families[familyIndex].ipSerialNo = updatedData.ipSerialNo!;
            }
            saveToStorage('families', families);
        }
    }

    // Update tithe log
    if ('tithe' in updatedData) {
        const titheIndex = titheLogs.findIndex(log => 
            log.year === year && log.month === month && log.familyId === familyId
        );
        if (titheIndex !== -1) {
            titheLogs[titheIndex].tithe = updatedData.tithe!;
            saveToStorage('tithes', titheLogs);
        } else {
            // This case might happen if data is inconsistent, let's create it
            const newTitheLog: StoredTitheLog = {
                id: crypto.randomUUID(),
                year, month, upaBial, familyId, tithe: updatedData.tithe!
            };
            titheLogs.push(newTitheLog);
            saveToStorage('tithes', titheLogs);
        }
    }
};

export const removeFamily = async (familyId: string): Promise<void> => {
    let families = getFromStorage<StoredFamily[]>('families', []);
    let titheLogs = getFromStorage<StoredTitheLog[]>('tithes', []);

    families = families.filter(f => f.id !== familyId);
    titheLogs = titheLogs.filter(log => log.familyId !== familyId);

    saveToStorage('families', families);
    saveToStorage('tithes', titheLogs);
};

export const transferFamily = async (familyId: string, destinationUpaBial: string): Promise<void> => {
    const families = getFromStorage<StoredFamily[]>('families', []);
    const titheLogs = getFromStorage<StoredTitheLog[]>('tithes', []);

    const familyIndex = families.findIndex(f => f.id === familyId);
    if (familyIndex !== -1) {
        families[familyIndex].currentBial = destinationUpaBial;
    }

    const updatedTitheLogs = titheLogs.map(log => {
        if (log.familyId === familyId) {
            return { ...log, upaBial: destinationUpaBial };
        }
        return log;
    });

    saveToStorage('families', families);
    saveToStorage('tithes', updatedTitheLogs);
};


// --- REPORTING API ---
export const fetchMonthlyReport = async (year: number, month: string): Promise<AggregateReportData> => {
    const report: AggregateReportData = {};
    const titheLogs = getFromStorage<StoredTitheLog[]>('tithes', []);

    const filteredLogs = titheLogs.filter(log => log.year === year && log.month === month);

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
    const titheLogs = getFromStorage<StoredTitheLog[]>('tithes', []);

    const filteredLogs = titheLogs.filter(log => log.year === year);
    
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
    const families = getFromStorage<StoredFamily[]>('families', []);
    const titheLogs = getFromStorage<StoredTitheLog[]>('tithes', []);
    
    const family = families.find(f => f.id === familyId);
    if (!family) {
        throw new Error("Family not found.");
    }

    const familyInfo = { name: family.name, ipSerialNo: family.ipSerialNo, upaBial: family.currentBial };

    const yearlyData: FamilyYearlyTitheData = {};
    MONTHS.forEach(month => {
        yearlyData[month] = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
    });
    
    const familyLogs = titheLogs.filter(log => log.year === year && log.familyId === familyId);

    familyLogs.forEach(log => {
        yearlyData[log.month] = log.tithe;
    });

    return { data: yearlyData, familyInfo };
};

export const fetchBialYearlyFamilyData = async (year: number, upaBial: string): Promise<YearlyFamilyTotal[]> => {
    const families = getFromStorage<StoredFamily[]>('families', []);
    const titheLogs = getFromStorage<StoredTitheLog[]>('tithes', []);
    
    const bialFamilies = families.filter(f => f.currentBial === upaBial);
    if (bialFamilies.length === 0) return [];
    
    const familyTotals = new Map<string, YearlyFamilyTotal>();
    bialFamilies.forEach(f => {
        familyTotals.set(f.id, {
            id: f.id, name: f.name, ipSerialNo: f.ipSerialNo,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 },
        });
    });

    const yearLogs = titheLogs.filter(log => log.year === year);

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

// --- AUTH API ---
// WARNING: This is a mock authentication system for demonstration purposes only.
// It is NOT secure and should NOT be used in production.
export const login = async (email: string, password: string): Promise<User> => {
    const users = getFromStorage<User[]>('users', []);
    const user = users.find(u => u.email === email);

    // Using a mock password check. In a real app, this would be hashed.
    if (user && (user as any).password === password) {
        saveToStorage('currentUserUid', user.uid);
        return user;
    } else if (email === 'admin@example.com' && password === 'admin123') {
        // Create a default admin user if one doesn't exist
        let adminUser = users.find(u => u.email === email);
        if (!adminUser) {
            adminUser = {
                uid: 'admin-user-01',
                name: 'Admin User',
                email: 'admin@example.com',
                assignedBial: null,
                ...({password: 'admin123'} as any)
            };
            users.push(adminUser);
            saveToStorage('users', users);
        }
        saveToStorage('currentUserUid', adminUser.uid);
        return adminUser;
    }
    
    throw new Error('Invalid email or password.');
};

export const register = async (name: string, email: string, password: string): Promise<User> => {
    const users = getFromStorage<User[]>('users', []);
    if (users.find(u => u.email === email)) {
        throw new Error('An account with this email already exists.');
    }
    const newUser: User & { password?: string } = {
        uid: crypto.randomUUID(),
        name,
        email,
        assignedBial: 'Upa Bial 1', // Default to a restricted bial
    };
    (newUser as any).password = password; // Storing password, again, NOT FOR PRODUCTION
    users.push(newUser);
    saveToStorage('users', users);
    return newUser;
};

// No-op for local storage
export const requestPasswordReset = async (email: string) => {
    console.log(`Password reset requested for ${email}. This is a mock; no email will be sent.`);
    return Promise.resolve();
};

export const getCurrentUser = async (): Promise<User | null> => {
    const uid = getFromStorage<string | null>('currentUserUid', null);
    if (!uid) return null;

    const users = getFromStorage<User[]>('users', []);
    return users.find(u => u.uid === uid) || null;
};

export const getAssignedBial = async (uid: string): Promise<string | null> => {
    const users = getFromStorage<User[]>('users', []);
    const user = users.find(u => u.uid === uid);
    return user ? user.assignedBial : null;
};

export const logout = () => {
    localStorage.removeItem('currentUserUid');
};
