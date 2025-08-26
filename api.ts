import { getFirebaseDb } from './firebase.ts';
// Fix: Use scoped firebase package for firestore imports to resolve module export errors.
import { 
    collection,
    query,
    where,
    getDocs,
    writeBatch,
    doc,
    addDoc,
    deleteDoc,
    updateDoc,
    serverTimestamp,
    getDoc,
    runTransaction,
    setDoc,
    orderBy,
} from '@firebase/firestore';
// Fix: Use scoped firebase package for auth imports to resolve module export errors.
import type { User as FirebaseUser } from '@firebase/auth';
import type { Family, Tithe, TitheCategory, AggregateReportData, FamilyYearlyTitheData, YearlyFamilyTotal, FamilyWithTithe, UserDoc } from './types.ts';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// --- USER MANAGEMENT API ---

export const createUserDocument = async (user: FirebaseUser): Promise<void> => {
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    // Create a document only if it doesn't already exist
    if (!userDoc.exists()) {
        const isAdmin = user.email === 'nkhiangte@gmail.com';
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0],
            isAdmin: isAdmin,       // Default role: not an admin, unless it's the specified email
            assignedBial: null, // Default role: no bial assigned
            createdAt: serverTimestamp(),
        });
    }
};

export const fetchAllUsers = async (): Promise<UserDoc[]> => {
    const db = getFirebaseDb();
    const usersQuery = query(collection(db, 'users'), orderBy('email'));
    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map(d => d.data() as UserDoc);
};

export const updateUserRoles = async (uid: string, roles: { isAdmin: boolean; assignedBial: string | null }): Promise<void> => {
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        isAdmin: roles.isAdmin,
        assignedBial: roles.assignedBial,
    });
};

export const fetchUserDocument = async (uid: string): Promise<UserDoc | null> => {
    const db = getFirebaseDb();
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserDoc;
    }
    return null;
};


// --- TITHE & FAMILY API ---

const getTitheLogRef = (year: number, month: string, familyId: string) => {
    const db = getFirebaseDb();
    const logId = `${year}_${month}_${familyId}`;
    return doc(db, 'titheLogs', logId);
};

export const fetchFamilies = async (year: number, month: string, upaBial: string): Promise<FamilyWithTithe[]> => {
    const db = getFirebaseDb();
    const familiesQuery = query(collection(db, 'families'), where('currentBial', '==', upaBial));
    const familiesSnapshot = await getDocs(familiesQuery);

    const familiesData: Family[] = familiesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Family));

    const familiesWithTithe: FamilyWithTithe[] = [];

    for (const family of familiesData) {
        const titheLogRef = getTitheLogRef(year, month, family.id);
        const titheDoc = await getDoc(titheLogRef);
        
        let tithe: Tithe = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
        if (titheDoc.exists()) {
            tithe = titheDoc.data().tithe as Tithe;
        }

        familiesWithTithe.push({
            id: family.id,
            name: family.name,
            ipSerialNo: family.ipSerialNo,
            tithe: tithe,
        });
    }
    
    return familiesWithTithe.sort((a, b) => (a.ipSerialNo ?? Infinity) - (b.ipSerialNo ?? Infinity));
};

export const addFamily = async (year: number, upaBial: string, name: string): Promise<void> => {
    const db = getFirebaseDb();
    const trimmedName = name.trim();
    const q = query(collection(db, 'families'), where('name', '==', trimmedName), where('currentBial', '==', upaBial));
    const existing = await getDocs(q);

    if (!existing.empty) {
        throw new Error(`Family "${trimmedName}" already exists in ${upaBial}.`);
    }

    await addDoc(collection(db, 'families'), {
        name: trimmedName,
        currentBial: upaBial,
        ipSerialNo: null,
        createdAt: serverTimestamp(),
    });
};

export const importFamilies = async (year: number, upaBial: string, familiesToImport: { name: string; ipSerialNo: number | null }[]): Promise<{added: number, skipped: number}> => {
    const db = getFirebaseDb();
    const batch = writeBatch(db);
    const familiesRef = collection(db, 'families');
    
    const q = query(familiesRef, where('currentBial', '==', upaBial));
    const snapshot = await getDocs(q);
    const existingNames = new Set(snapshot.docs.map(d => d.data().name.trim().toLowerCase()));
    
    // De-duplicate the list from the file, keeping the first occurrence.
    const uniqueFamiliesFromFile = new Map<string, { name: string; ipSerialNo: number | null }>();
    for (const family of familiesToImport) {
        const trimmedName = family.name.trim();
        if (trimmedName && !uniqueFamiliesFromFile.has(trimmedName.toLowerCase())) {
            uniqueFamiliesFromFile.set(trimmedName.toLowerCase(), family);
        }
    }
    
    let addedCount = 0;
    // Skipped count starts with families that were duplicates within the file itself.
    let skippedCount = familiesToImport.length - uniqueFamiliesFromFile.size;

    for (const family of uniqueFamiliesFromFile.values()) {
        const trimmedName = family.name.trim();
        if (existingNames.has(trimmedName.toLowerCase())) {
            skippedCount++;
        } else {
            const newFamilyRef = doc(familiesRef);
            batch.set(newFamilyRef, {
                name: trimmedName,
                currentBial: upaBial,
                ipSerialNo: family.ipSerialNo, // Set the serial number
                createdAt: serverTimestamp(),
            });
            addedCount++;
            existingNames.add(trimmedName.toLowerCase()); // Add to set to prevent duplicates from within the same batch.
        }
    }

    if (addedCount > 0) {
        await batch.commit();
    }
    
    return { added: addedCount, skipped: skippedCount };
};

export const importContributions = async (
    year: number,
    month: string,
    upaBial: string,
    contributionsToImport: { name: string; ipSerialNo: number | null; tithe: Tithe }[]
): Promise<{ updated: number; skipped: number; skippedInfo: { name: string, reason: string }[] }> => {
    const db = getFirebaseDb();
    const batch = writeBatch(db);

    // 1. Fetch all families for the given upaBial
    const familiesQuery = query(collection(db, 'families'), where('currentBial', '==', upaBial));
    const familiesSnapshot = await getDocs(familiesQuery);
    
    // 2. Create maps for quick lookup
    const familiesByName = new Map<string, Family>();
    const familiesBySerial = new Map<number, Family>();
    familiesSnapshot.docs.forEach(d => {
        const family = { id: d.id, ...d.data() } as Family;
        familiesByName.set(family.name.trim().toLowerCase(), family);
        if (family.ipSerialNo !== null && family.ipSerialNo !== undefined) {
            familiesBySerial.set(family.ipSerialNo, family);
        }
    });

    let updatedCount = 0;
    const skippedRecords: { name: string, reason: string }[] = [];
    const processedNames = new Set<string>();

    // 3. Iterate through imported contribution data
    for (const record of contributionsToImport) {
        const trimmedName = record.name.trim();
        if (!trimmedName || processedNames.has(trimmedName.toLowerCase())) {
            // Skip empty names or duplicates within the file
            continue;
        }
        processedNames.add(trimmedName.toLowerCase());

        let familyToUpdate: Family | undefined = undefined;

        // 4. Try to find a matching family
        // First by S/N
        if (record.ipSerialNo !== null && record.ipSerialNo !== undefined) {
            familyToUpdate = familiesBySerial.get(record.ipSerialNo);
        }
        // If not found by S/N, try by name
        if (!familyToUpdate) {
            familyToUpdate = familiesByName.get(trimmedName.toLowerCase());
        }

        // 5. If a family is found, create/update their titheLog
        if (familyToUpdate) {
            const logRef = getTitheLogRef(year, month, familyToUpdate.id);
            // This is a "set" operation because we are replacing the entire month's data.
            batch.set(logRef, {
                year,
                month,
                familyId: familyToUpdate.id,
                upaBial,
                tithe: record.tithe,
                lastUpdated: serverTimestamp()
            });
            updatedCount++;
        } else {
            skippedRecords.push({ name: trimmedName, reason: "Family not found in this Upa Bial." });
        }
    }

    if (updatedCount > 0) {
        await batch.commit();
    }

    return {
        updated: updatedCount,
        skipped: skippedRecords.length,
        skippedInfo: skippedRecords
    };
};

export const updateTithe = async (year: number, month: string, upaBial: string, familyId: string, categoryOrTithe: TitheCategory | Tithe, value?: number): Promise<void> => {
    const db = getFirebaseDb();
    const logRef = getTitheLogRef(year, month, familyId);
    
    await runTransaction(db, async (transaction) => {
        const logDoc = await transaction.get(logRef);
        
        if (!logDoc.exists()) {
             const newTithe: Tithe = typeof categoryOrTithe === 'object' 
                   ? categoryOrTithe 
                   : { pathianRam: 0, ramthar: 0, tualchhung: 0, [categoryOrTithe]: value! };
            transaction.set(logRef, {
                year,
                month,
                familyId,
                upaBial,
                tithe: newTithe,
                lastUpdated: serverTimestamp()
            });
        } else {
            const currentData = logDoc.data();
            let updatedTithe: Tithe;
            if (typeof categoryOrTithe === 'object') {
                updatedTithe = categoryOrTithe;
            } else {
                updatedTithe = { ...currentData.tithe, [categoryOrTithe]: value! };
            }
             transaction.update(logRef, { 
                tithe: updatedTithe,
                lastUpdated: serverTimestamp()
            });
        }
    });
};

export const updateFamilyDetails = async (familyId: string, data: { name?: string; ipSerialNo?: number | null }): Promise<void> => {
    const db = getFirebaseDb();
    const familyRef = doc(db, 'families', familyId);
    await updateDoc(familyRef, data);
};

export const removeFamily = async (familyId: string): Promise<void> => {
    const db = getFirebaseDb();
    const batch = writeBatch(db);
    
    // Delete the family document
    const familyRef = doc(db, 'families', familyId);
    batch.delete(familyRef);
    
    // Find and delete all associated tithe logs
    const logsQuery = query(collection(db, 'titheLogs'), where('familyId', '==', familyId));
    const logsSnapshot = await getDocs(logsQuery);
    logsSnapshot.forEach(logDoc => {
        batch.delete(logDoc.ref);
    });

    await batch.commit();
};

export const transferFamily = async (familyId: string, destinationUpaBial: string): Promise<void> => {
    const db = getFirebaseDb();
    const batch = writeBatch(db);

    // Update the family's currentBial
    const familyRef = doc(db, 'families', familyId);
    batch.update(familyRef, { currentBial: destinationUpaBial });
    
    // Find and update all associated tithe logs
    const logsQuery = query(collection(db, 'titheLogs'), where('familyId', '==', familyId));
    const logsSnapshot = await getDocs(logsQuery);
    logsSnapshot.forEach(logDoc => {
        batch.update(logDoc.ref, { upaBial: destinationUpaBial });
    });

    await batch.commit();
};

// --- REPORTING API ---
export const fetchMonthlyReport = async (year: number, month: string): Promise<AggregateReportData> => {
    const db = getFirebaseDb();
    const report: AggregateReportData = {};
    const logsQuery = query(collection(db, 'titheLogs'), where('year', '==', year), where('month', '==', month));
    const logsSnapshot = await getDocs(logsQuery);

    logsSnapshot.forEach(doc => {
        const { upaBial, tithe } = doc.data();
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
    const db = getFirebaseDb();
    const report: AggregateReportData = {};
    const logsQuery = query(collection(db, 'titheLogs'), where('year', '==', year));
    const logsSnapshot = await getDocs(logsQuery);
    
    logsSnapshot.forEach(doc => {
        const { upaBial, tithe } = doc.data();
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
    const db = getFirebaseDb();
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    if (!familyDoc.exists()) {
        throw new Error("Family not found.");
    }
    const familyData = familyDoc.data() as Omit<Family, 'id'>;
    const familyInfo = { name: familyData.name, ipSerialNo: familyData.ipSerialNo, upaBial: familyData.currentBial };

    const yearlyData: FamilyYearlyTitheData = {};
    MONTHS.forEach(month => {
        yearlyData[month] = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
    });

    const logsQuery = query(collection(db, 'titheLogs'), where('year', '==', year), where('familyId', '==', familyId));
    const logsSnapshot = await getDocs(logsQuery);
    logsSnapshot.forEach(doc => {
        const log = doc.data();
        yearlyData[log.month] = log.tithe;
    });

    return { data: yearlyData, familyInfo };
};


export const fetchBialYearlyFamilyData = async (year: number, upaBial: string): Promise<YearlyFamilyTotal[]> => {
    const db = getFirebaseDb();
    const familiesQuery = query(collection(db, 'families'), where('currentBial', '==', upaBial));
    const familiesSnapshot = await getDocs(familiesQuery);
    if (familiesSnapshot.empty) return [];

    const familyTotalsMap = new Map<string, YearlyFamilyTotal>();
    familiesSnapshot.docs.forEach(d => {
        const family = { id: d.id, ...d.data() } as Family;
        familyTotalsMap.set(family.id, {
            id: family.id,
            name: family.name,
            ipSerialNo: family.ipSerialNo,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 },
        });
    });

    const logsQuery = query(collection(db, 'titheLogs'), where('year', '==', year), where('upaBial', '==', upaBial));
    const logsSnapshot = await getDocs(logsQuery);

    logsSnapshot.forEach(doc => {
        const log = doc.data();
        const familyTotal = familyTotalsMap.get(log.familyId);
        if (familyTotal) {
            familyTotal.tithe.pathianRam += log.tithe.pathianRam;
            familyTotal.tithe.ramthar += log.tithe.ramthar;
            familyTotal.tithe.tualchhung += log.tithe.tualchhung;
        }
    });

    return Array.from(familyTotalsMap.values()).sort((a, b) => (a.ipSerialNo ?? Infinity) - (b.ipSerialNo ?? Infinity));
};