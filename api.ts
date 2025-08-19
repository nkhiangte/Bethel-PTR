import type { YearlyData, Family, Tithe, AggregateReportData, BialTotal, User } from './types.ts';

// --- CONFIGURATION ---
const SIMULATED_LATENCY_MS = 200;
const DB_KEY = 'titheData';
const AUTH_TOKEN_KEY = 'authToken';
const USERS_DB_KEY = 'users';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const UPA_BIALS = Array.from({ length: 13 }, (_, i) => `Upa Bial ${i + 1}`);

// --- HELPERS ---
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, SIMULATED_LATENCY_MS));

const getInitialData = (): YearlyData => {
    const currentYear = new Date().getFullYear();
    const currentMonth = MONTHS[new Date().getMonth()];
    return {
        [currentYear]: {
            [currentMonth]: {
                "Upa Bial 1": [
                    { id: '1', name: 'Vanlalruata Family', ipSerialNo: 1, tithe: { pathianRam: 1000, ramthar: 500, tualchhung: 300 } },
                    { id: '2', name: 'Lalchhanhima Family', ipSerialNo: 2, tithe: { pathianRam: 1200, ramthar: 600, tualchhung: 400 } },
                ],
                "Upa Bial 2": [
                    { id: '3', name: 'Zoremsangi Family', ipSerialNo: 3, tithe: { pathianRam: 800, ramthar: 400, tualchhung: 250 } },
                ]
            }
        }
    };
};

const getDatabase = (): YearlyData => {
    try {
        const data = localStorage.getItem(DB_KEY);
        if (data) {
            return JSON.parse(data);
        }
        const initialData = getInitialData();
        localStorage.setItem(DB_KEY, JSON.stringify(initialData));
        return initialData;
    } catch (error) {
        console.error("Could not access localStorage. Using in-memory data.", error);
        return getInitialData();
    }
};

const saveDatabase = (db: YearlyData) => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (error) {
        console.error("Could not save to localStorage.", error);
    }
};


// --- DATA API ---

export const fetchFamilies = async (year: number, month: string, upaBial: string): Promise<Family[]> => {
    await simulateDelay();
    const db = getDatabase();
    return db[year]?.[month]?.[upaBial] ?? [];
};

export const addFamily = async (year: number, month: string, upaBial: string, name: string): Promise<Family> => {
    await simulateDelay();
    const db = getDatabase();
    const newFamily: Family = {
        id: new Date().getTime().toString(),
        name,
        ipSerialNo: null,
        tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 },
    };

    if (!db[year]) db[year] = {};
    if (!db[year][month]) db[year][month] = {};
    if (!db[year][month][upaBial]) db[year][month][upaBial] = [];
    
    db[year][month][upaBial].push(newFamily);
    saveDatabase(db);
    return newFamily;
};

export const importFamilies = async (year: number, month: string, upaBial: string, names: string[]): Promise<void> => {
    await simulateDelay();
    const db = getDatabase();
    
    const newFamilies: Family[] = names.map(name => ({
      id: `${new Date().getTime()}-${name}-${Math.random()}`,
      name: name,
      ipSerialNo: null,
      tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 },
    }));

    if (!db[year]) db[year] = {};
    if (!db[year][month]) db[year][month] = {};
    if (!db[year][month][upaBial]) db[year][month][upaBial] = [];

    db[year][month][upaBial].push(...newFamilies);
    saveDatabase(db);
};

export const updateFamily = async (year: number, month: string, upaBial: string, familyId: string, updatedData: Partial<Family>): Promise<Family> => {
    await simulateDelay();
    const db = getDatabase();
    const families = db[year]?.[month]?.[upaBial] ?? [];
    const familyIndex = families.findIndex(f => f.id === familyId);

    if (familyIndex === -1) throw new Error("Family not found");

    const updatedFamily = { ...families[familyIndex], ...updatedData };
    families[familyIndex] = updatedFamily;
    db[year][month][upaBial] = families;
    saveDatabase(db);
    return updatedFamily;
};

export const removeFamily = async (year: number, month: string, upaBial: string, familyId: string): Promise<void> => {
    await simulateDelay();
    const db = getDatabase();
    const families = db[year]?.[month]?.[upaBial] ?? [];
    if (db[year]?.[month]) {
        db[year][month][upaBial] = families.filter(f => f.id !== familyId);
    }
    saveDatabase(db);
};


// --- REPORTING API ---
export const fetchMonthlyReport = async (year: number, month: string): Promise<AggregateReportData> => {
    await simulateDelay();
    const db = getDatabase();
    const monthData = db[year]?.[month];
    if (!monthData) return {};
    
    const report: AggregateReportData = {};
    UPA_BIALS.forEach(bial => {
      const families = monthData[bial] ?? [];
      const bialTotal = families.reduce<BialTotal>((acc, family) => {
        acc.pathianRam += family.tithe.pathianRam;
        acc.ramthar += family.tithe.ramthar;
        acc.tualchhung += family.tithe.tualchhung;
        acc.total += family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung;
        return acc;
      }, { pathianRam: 0, ramthar: 0, tualchhung: 0, total: 0 });
      if (bialTotal.total > 0) report[bial] = bialTotal;
    });
    return report;
};

export const fetchYearlyReport = async (year: number): Promise<AggregateReportData> => {
    await simulateDelay();
    const db = getDatabase();
    const yearData = db[year];
    if (!yearData) return {};

    const report: AggregateReportData = {};
    UPA_BIALS.forEach(bial => {
        const bialTotalForYear: BialTotal = { pathianRam: 0, ramthar: 0, tualchhung: 0, total: 0 };
        MONTHS.forEach(month => {
            const families = yearData[month]?.[bial] ?? [];
            families.forEach(family => {
                bialTotalForYear.pathianRam += family.tithe.pathianRam;
                bialTotalForYear.ramthar += family.tithe.ramthar;
                bialTotalForYear.tualchhung += family.tithe.tualchhung;
                bialTotalForYear.total += family.tithe.pathianRam + family.tithe.ramthar + family.tithe.tualchhung;
            });
        });
        if (bialTotalForYear.total > 0) report[bial] = bialTotalForYear;
    });
    return report;
};


// --- AUTH API ---

const getUsers = (): User[] => {
    try {
        const users = localStorage.getItem(USERS_DB_KEY);
        // Add a default user if none exist
        if (!users) {
            // NOTE: In a real app, never store plain text passwords. This is a mock.
            const defaultUser: User = { id: '1', name: 'Default User', phone: '1234567890', passwordHash: 'password123' };
            localStorage.setItem(USERS_DB_KEY, JSON.stringify([defaultUser]));
            return [defaultUser];
        }
        return JSON.parse(users);
    } catch (error) {
        return [];
    }
};

const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

export const login = async (phone: string, password: string): Promise<{ token: string }> => {
    await simulateDelay();
    const users = getUsers();
    const user = users.find(u => u.phone === phone && u.passwordHash === password);

    if (user) {
        const token = `mock-token-${user.id}-${Date.now()}`;
        
        // The token is no longer saved to the central user record, allowing multiple sessions.
        // It's only given to the client to be stored locally.
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        return { token };
    } else {
        throw new Error("Invalid phone number or password.");
    }
};

export const register = async (name: string, phone: string, password: string): Promise<User> => {
    await simulateDelay();
    const users = getUsers();
    if (users.some(u => u.phone === phone)) {
        throw new Error("A user with this phone number already exists.");
    }
    const newUser: User = {
        id: new Date().getTime().toString(),
        name,
        phone,
        passwordHash: password, // Again, this is a mock. Use hashing in real apps.
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
};

export const requestPasswordReset = async (phone: string): Promise<string | null> => {
    await simulateDelay();
    const users = getUsers();
    const user = users.find(u => u.phone === phone);
    if (user) {
        // For this mock app, we'll return the password.
        // In a real app, this is a major security vulnerability.
        return user.passwordHash;
    }
    return null; // User not found
};

export const checkAuth = (): boolean => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
        return false;
    }

    try {
        // The token format is 'mock-token-USER_ID-TIMESTAMP'
        const parts = token.split('-');
        if (parts.length < 3 || parts[0] !== 'mock' || parts[1] !== 'token') {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            return false;
        }
        const userId = parts[2];
        
        const users = getUsers();
        // The check is now just to see if a user with this ID exists.
        // This allows multiple device logins, as we are not invalidating old tokens.
        const userExists = users.some(u => u.id === userId);

        if (userExists) {
            return true;
        }

        // If user doesn't exist (e.g., deleted), the token is invalid.
        localStorage.removeItem(AUTH_TOKEN_KEY);
        return false;
    } catch (e) {
        // Handle potential error if token format is unexpected
        localStorage.removeItem(AUTH_TOKEN_KEY);
        return false;
    }
};

export const logout = () => {
    // We just need to remove the token from the current device's storage.
    // There is no central session token to clear anymore.
    localStorage.removeItem(AUTH_TOKEN_KEY);
};