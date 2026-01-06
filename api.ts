
// Fix: import firebase compat for types and serverTimestamp
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db } from './firebase.ts';
import type { Family, Tithe, TitheCategory, AggregateReportData, FamilyYearlyTitheData, YearlyFamilyTotal, FamilyWithTithe, UserDoc, BialInfo, ArchiveStatus } from './types.ts';

// Fix: Use firebase.User for FirebaseUser type
type FirebaseUser = firebase.User;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// --- SETTINGS / UPA BIAL MANAGEMENT ---

const SEED_UPA_BIALS = [
  "Upa Bial 1", "Upa Bial 2", "Upa Bial 3", "Upa Bial 4", "Upa Bial 5",
  "Upa Bial 6", "Upa Bial 7", "Upa Bial 8", "Upa Bial 9", "Upa Bial 10",
  "Upa Bial 11", "Upa Bial 12", "Upa Bial 13"
];

export const fetchUpaBials = async (year: number): Promise<string[]> => {
    const yearDocRef = db.collection('settings').doc(String(year));
    const doc = await yearDocRef.get();
    
    if (doc.exists && doc.data()?.list) {
        const bials = doc.data()!.list || [];
        return bials.sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }

    // If doc for the year doesn't exist, find the most recent year's list to copy from.
    // This is more robust as it doesn't require a specific Firestore index.
    const snapshot = await db.collection('settings').get();

    let bialsToSeed: string[];
    if (snapshot.empty) {
        // This is the first time ever running, so use the hardcoded seed.
        bialsToSeed = SEED_UPA_BIALS;
    } else {
        // Find the doc with the highest year ID to copy from.
        let latestYear = 0;
        let latestList: string[] = [];
        snapshot.forEach(doc => {
            const docYear = parseInt(doc.id, 10);
            if (!isNaN(docYear) && docYear > latestYear) {
                latestYear = docYear;
                latestList = doc.data().list || [];
            }
        });

        if (latestList.length > 0) {
             bialsToSeed = latestList;
        } else {
            // Fallback if no valid year documents were found,
            // which could happen if only legacy documents exist.
            bialsToSeed = SEED_UPA_BIALS;
        }
    }
    
    // Create the document for the new year with the determined list.
    await yearDocRef.set({ list: bialsToSeed });
    return bialsToSeed.sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
};

export const updateUpaBialsList = async (year: number, newList: string[]): Promise<void> => {
    const yearDocRef = db.collection('settings').doc(String(year));
    await yearDocRef.set({ list: newList });
};

export const isBialInUse = async (year: number, bialName: string): Promise<boolean> => {
    // Corrected: Check against titheLogs for the specified year and upaBial
    const logsQuery = db.collection('titheLogs')
                        .where('year', '==', year)
                        .where('upaBial', '==', bialName) // Corrected from 'month' == 'bialName'
                        .limit(1);
    const snapshot = await logsQuery.get();
    return !snapshot.empty;
};

export const fetchArchiveStatus = async (year: number): Promise<boolean> => {
    const docRef = db.collection('settings').doc(String(year)).collection('archive').doc('current');
    const docSnap = await docRef.get();
    return docSnap.exists && (docSnap.data() as ArchiveStatus).isArchived === true;
};

export const updateArchiveStatus = async (year: number, isArchived: boolean): Promise<void> => {
    const docRef = db.collection('settings').doc(String(year)).collection('archive').doc('current');
    await docRef.set({ isArchived: isArchived }, { merge: true });
};


// --- USER MANAGEMENT API ---

export const createUserDocument = async (user: FirebaseUser, additionalData?: { displayName: string, assignedBial: string | null }): Promise<void> => {
    // Fix: Use v8 compat syntax
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    // Create a document only if it doesn't already exist
    if (!userDoc.exists) {
        const isAdmin = user.email === 'nkhiangte@gmail.com';
        // Fix: Use v8 compat syntax for set and serverTimestamp
        await userRef.set({
            uid: user.uid,
            email: user.email,
            displayName: additionalData?.displayName || user.displayName || user.email?.split('@')[0],
            isAdmin: isAdmin,       // Default role: not an admin, unless it's the specified email
            assignedBial: isAdmin ? null : (additionalData?.assignedBial || null), // Default role: no bial assigned
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    }
};

export const fetchAllUsers = async (): Promise<UserDoc[]> => {
    // Fix: Use v8 compat syntax for query and get
    const usersQuery = db.collection('users').orderBy('email');
    const snapshot = await usersQuery.get();
    return snapshot.docs.map(d => d.data() as UserDoc);
};

export const updateUserRoles = async (uid: string, roles: { isAdmin: boolean; assignedBial: string | null }): Promise<void> => {
    // Fix: Use v8 compat syntax
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
        isAdmin: roles.isAdmin,
        assignedBial: roles.assignedBial,
    });
};

export const fetchUserDocument = async (uid: string): Promise<UserDoc | null> => {
    // Fix: Use v8 compat syntax
    const userRef = db.collection('users').doc(uid);
    const docSnap = await userRef.get();
    if (docSnap.exists) {
        return docSnap.data() as UserDoc;
    }
    return null;
};

/**
 * Removes a user's document from the Firestore 'users' collection.
 * Note: This does not delete the user from Firebase Authentication, 
 * but it revokes their access to the app since access depends on the Firestore document.
 */
export const deleteUserDocument = async (uid: string): Promise<void> => {
    await db.collection('users').doc(uid).delete();
};


// --- TITHE & FAMILY API ---

const getTitheLogRef = (year: number, month: string, familyId: string) => {
    const logId = `${year}_${month}_${familyId}`;
    // Fix: Use v8 compat syntax
    return db.collection('titheLogs').doc(logId);
};

export const fetchFamilies = async (year: number, month: string, upaBial: string): Promise<FamilyWithTithe[]> => {
    const familiesRef = db.collection('families');
    const titheLogsRef = db.collection('titheLogs');
    const currentYear = new Date().getFullYear();

    const familyIdsInBial = new Set<string>();
    const titheDataMap = new Map<string, Tithe>(); // Map familyId to its tithe for the month

    // 1. Get families based on existing tithe logs for the specific year, month, and upaBial
    const logsQuery = titheLogsRef
        .where('year', '==', year)
        .where('month', '==', month)
        .where('upaBial', '==', upaBial);
    const logsSnapshot = await logsQuery.get();

    logsSnapshot.forEach(doc => {
        const data = doc.data();
        familyIdsInBial.add(data.familyId);
        titheDataMap.set(data.familyId, data.tithe as Tithe);
    });

    // 2. If it's the current year, also include families currently assigned to this upaBial,
    // even if they haven't made a contribution yet this month.
    if (year === currentYear) {
        const currentBialFamiliesQuery = familiesRef.where('currentBial', '==', upaBial);
        const currentBialFamiliesSnapshot = await currentBialFamiliesQuery.get();
        currentBialFamiliesSnapshot.forEach(doc => {
            const family = { id: doc.id, ...doc.data() } as Family;
            // Add to the set only if not already present from tithe logs
            if (!familyIdsInBial.has(family.id)) {
                familyIdsInBial.add(family.id);
            }
        });
    }

    const uniqueFamilyIds = Array.from(familyIdsInBial);

    if (uniqueFamilyIds.length === 0) {
        return []; // No families found for this criteria
    }

    // 3. Fetch full family documents for all identified family IDs
    const familiesDocs: Family[] = [];
    // Firestore `in` query is limited to 10. Need to chunk if more than 10 families.
    const chunks: string[][] = [];
    for (let i = 0; i < uniqueFamilyIds.length; i += 10) {
        chunks.push(uniqueFamilyIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
        const chunkSnapshot = await familiesRef.where(firebase.firestore.FieldPath.documentId(), 'in', chunk).get();
        chunkSnapshot.forEach(doc => {
            familiesDocs.push({ id: doc.id, ...doc.data() } as Family);
        });
    }

    // 4. Combine family data with their tithe for the specific month
    const familiesWithTithe: FamilyWithTithe[] = familiesDocs.map(family => {
        const tithe = titheDataMap.get(family.id) || { pathianRam: 0, ramthar: 0, tualchhung: 0 };
        return {
            id: family.id,
            name: family.name,
            ipSerialNo: family.ipSerialNo,
            tithe: tithe,
        };
    });

    // Sort by S/N
    return familiesWithTithe.sort((a, b) => (a.ipSerialNo ?? Infinity) - (b.ipSerialNo ?? Infinity));
};

// New function to fetch a single family by ID
export const fetchFamilyById = async (familyId: string): Promise<Family | null> => {
    const docRef = db.collection('families').doc(familyId);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as Family;
    }
    return null;
};


export const addFamily = async (year: number, upaBial: string, name: string): Promise<void> => {
    const trimmedName = name.trim();
    // Fix: Use v8 compat syntax
    const q = db.collection('families').where('name', '==', trimmedName).where('currentBial', '==', upaBial);
    const existing = await q.get();

    if (!existing.empty) {
        throw new Error(`Family "${trimmedName}" already exists in ${upaBial}.`);
    }

    // Fix: Use v8 compat syntax
    await db.collection('families').add({
        name: trimmedName,
        currentBial: upaBial,
        ipSerialNo: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
};

export const importFamilies = async (year: number, upaBial: string, familiesToImport: { name: string; ipSerialNo: number | null }[]): Promise<{added: number, skipped: number}> => {
    // Fix: Use v8 compat syntax
    const batch = db.batch();
    const familiesRef = db.collection('families');
    
    const q = familiesRef.where('currentBial', '==', upaBial);
    const snapshot = await q.get();
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
            // Fix: Use v8 compat doc() on collection
            const newFamilyRef = familiesRef.doc();
            batch.set(newFamilyRef, {
                name: trimmedName,
                currentBial: upaBial,
                ipSerialNo: family.ipSerialNo, // Set the serial number
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
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
): Promise<{ updated: number; created: number; skipped: number; skippedInfo: { name: string, reason: string }[] }> => {
    // Fix: Use v8 compat syntax
    const batch = db.batch();

    // 1. Fetch all families for the given upaBial
    const familiesQuery = db.collection('families').where('currentBial', '==', upaBial);
    const familiesSnapshot = await familiesQuery.get();
    
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

    let updatedCount = 0;    let createdCount = 0;
    const skippedRecords: { name: string, reason: string }[] = [];
    const processedNames = new Set<string>();

    // 3. Iterate through imported contribution data
    for (const record of contributionsToImport) {
        const trimmedName = record.name.trim();
        if (!trimmedName || processedNames.has(trimmedName.toLowerCase())) {
             if (trimmedName && processedNames.has(trimmedName.toLowerCase())) {
                skippedRecords.push({ name: trimmedName, reason: "Duplicate entry in the import file." });
            }
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

        // 5. If a family is found, create/update their titheLog. If not, create them.
        if (familyToUpdate) {
            const logRef = getTitheLogRef(year, month, familyToUpdate.id);
            // This is a "set" operation because we are replacing the entire month's data.
            batch.set(logRef, {
                year,
                month,
                familyId: familyToUpdate.id,
                upaBial,
                tithe: record.tithe,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            updatedCount++;
        } else {
            // Family not found - CREATE a new family and their tithe log.
            const familiesRef = db.collection('families');
            const newFamilyRef = familiesRef.doc(); // Create a new doc reference with a local ID
            
            // Add the new family to the batch
            batch.set(newFamilyRef, {
                name: trimmedName,
                currentBial: upaBial,
                ipSerialNo: record.ipSerialNo,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            // Add the tithe log for the new family to the batch, using the new local ID
            const logRef = getTitheLogRef(year, month, newFamilyRef.id);
            batch.set(logRef, {
                year,
                month,
                familyId: newFamilyRef.id,
                upaBial,
                tithe: record.tithe,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            createdCount++;
        }
    }

    if (updatedCount > 0 || createdCount > 0) {
        await batch.commit();
    }

    return {
        updated: updatedCount,
        created: createdCount,
        skipped: skippedRecords.length,
        skippedInfo: skippedRecords
    };
};

export const updateTithe = async (year: number, month: string, upaBial: string, familyId: string, categoryOrTithe: TitheCategory | Tithe, value?: number): Promise<void> => {
    const logRef = getTitheLogRef(year, month, familyId);
    
    // Fix: Use v8 compat syntax
    await db.runTransaction(async (transaction) => {
        const logDoc = await transaction.get(logRef);
        
        if (!logDoc.exists) {
             const newTithe: Tithe = typeof categoryOrTithe === 'object' 
                   ? categoryOrTithe 
                   : { pathianRam: 0, ramthar: 0, tualchhung: 0, [categoryOrTithe]: value! };
            transaction.set(logRef, {
                year,
                month,
                familyId,
                upaBial,
                tithe: newTithe,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const currentData = logDoc.data()!;
            let updatedTithe: Tithe;
            if (typeof categoryOrTithe === 'object') {
                updatedTithe = categoryOrTithe;
            } else {
                updatedTithe = { ...currentData.tithe, [categoryOrTithe]: value! };
            }
             transaction.update(logRef, { 
                tithe: updatedTithe,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    });
};

export const updateFamilyDetails = async (familyId: string, data: { name?: string; ipSerialNo?: number | null }): Promise<void> => {
    // Fix: Use v8 compat syntax
    const familyRef = db.collection('families').doc(familyId);
    await familyRef.update(data);
};

export const removeFamily = async (familyId: string, year: number): Promise<void> => {
    const batch = db.batch();
    
    // 1. Update the family document's currentBial to null
    // This effectively removes them from any active Bial assignment going forward.
    const familyRef = db.collection('families').doc(familyId);
    batch.update(familyRef, { currentBial: null });

    // 2. Delete all associated tithe logs *only for the specified year*
    // This preserves contributions from other years.
    const logsQuery = db.collection('titheLogs').where('familyId', '==', familyId).where('year', '==', year);
    const logsSnapshot = await logsQuery.get();
    logsSnapshot.forEach(logDoc => {
        batch.delete(logDoc.ref);
    });

    await batch.commit();
};

export const bulkRemoveFamilies = async (familyIds: string[], year: number): Promise<void> => {
    // Process in chunks to ensure reliability, though we could try parallel.
    // Given potential transaction limits, simple parallel execution with chunking is safest.
    const chunkSize = 10;
    for (let i = 0; i < familyIds.length; i += chunkSize) {
        const chunk = familyIds.slice(i, i + chunkSize);
        await Promise.all(chunk.map(id => removeFamily(id, year)));
    }
};

export const removeAllFamiliesFromBial = async (year: number, bialName: string): Promise<void> => {
    // 1. Unassign families currently in this Bial
    const familiesQuery = db.collection('families').where('currentBial', '==', bialName);
    const familiesSnap = await familiesQuery.get();
    
    const familyBatches = [];
    let currentFamilyBatch = db.batch();
    let familyOpCount = 0;

    familiesSnap.forEach(doc => {
        currentFamilyBatch.update(doc.ref, { currentBial: null });
        familyOpCount++;
        if (familyOpCount >= 450) {
            familyBatches.push(currentFamilyBatch.commit());
            currentFamilyBatch = db.batch();
            familyOpCount = 0;
        }
    });
    if (familyOpCount > 0) {
        familyBatches.push(currentFamilyBatch.commit());
    }
    await Promise.all(familyBatches);

    // 2. Delete tithe logs for this Bial in this Year
    const logsQuery = db.collection('titheLogs')
        .where('year', '==', year)
        .where('upaBial', '==', bialName);
    const logsSnap = await logsQuery.get();

    const logBatches = [];
    let currentLogBatch = db.batch();
    let logOpCount = 0;

    logsSnap.forEach(doc => {
        currentLogBatch.delete(doc.ref);
        logOpCount++;
        if (logOpCount >= 450) {
            logBatches.push(currentLogBatch.commit());
            currentLogBatch = db.batch();
            logOpCount = 0;
        }
    });
    if (logOpCount > 0) {
        logBatches.push(currentLogBatch.commit());
    }
    await Promise.all(logBatches);
};

export const transferFamily = async (familyId: string, destinationUpaBial: string): Promise<void> => {
    // Only update the currentBial field on the family document.
    // Do NOT update historical titheLogs, as they should reflect the bial at the time of contribution.
    const familyRef = db.collection('families').doc(familyId);
    await familyRef.update({ currentBial: destinationUpaBial });
};

// New API function for unassigning a family from their current Bial globally
export const unassignFamilyFromBial = async (familyId: string): Promise<void> => {
    const familyRef = db.collection('families').doc(familyId);
    await familyRef.update({ currentBial: null });
};

// New API function for searching all families
export const searchAllFamilies = async (searchTerm: string = ''): Promise<Family[]> => {
    const familiesRef = db.collection('families');
    const snapshot = await familiesRef.orderBy('name').get(); // Fetch all (or a large initial set) and order by name

    let results: Family[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Family));

    const filterTerm = searchTerm.trim().toLowerCase();
    if (filterTerm !== '') {
        // Apply client-side filtering for broader search capabilities (partial match on name, or serial number)
        results = results.filter(family =>
            family.name.toLowerCase().includes(filterTerm) ||
            family.ipSerialNo?.toString().includes(filterTerm)
        );
    }
    
    return results;
};


// --- REPORTING API ---
export const fetchMonthlyReport = async (year: number, month: string): Promise<AggregateReportData> => {
    const report: AggregateReportData = {};
    // Fix: Use v8 compat syntax
    const logsQuery = db.collection('titheLogs').where('year', '==', year).where('month', '==', month);
    const logsSnapshot = await logsQuery.get();

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
    const report: AggregateReportData = {};
    // Fix: Use v8 compat syntax
    const logsQuery = db.collection('titheLogs').where('year', '==', year);
    const logsSnapshot = await logsQuery.get();
    
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

// For FamilyYearlyReport.tsx
export const fetchFamilyYearlyData = async (year: number, familyId: string): Promise<{ data: FamilyYearlyTitheData, familyInfo: { name: string, ipSerialNo: number | null } }> => {
    // Fix: Use v8 compat syntax
    const familyRef = db.collection('families').doc(familyId);
    const familySnap = await familyRef.get();

    if (!familySnap.exists) {
        throw new Error('Family not found.');
    }
    const familyData = familySnap.data()!;
    const familyInfo = { 
        name: familyData.name as string, 
        ipSerialNo: familyData.ipSerialNo as number | null 
    };

    const yearlyData: FamilyYearlyTitheData = {};
    // Fix: Use v8 compat syntax
    const logsQuery = db.collection('titheLogs').where('year', '==', year).where('familyId', '==', familyId);
    const logsSnapshot = await logsQuery.get();

    logsSnapshot.forEach(doc => {
        const log = doc.data();
        yearlyData[log.month] = log.tithe as Tithe;
    });

    return { data: yearlyData, familyInfo };
};

// For BialYearlyFamilyReport.tsx
export const fetchBialYearlyFamilyData = async (year: number, upaBial: string): Promise<YearlyFamilyTotal[]> => {
    const familiesRef = db.collection('families');
    const logsRef = db.collection('titheLogs');
    const currentYear = new Date().getFullYear();

    // 1. Find all familyIds that made contributions to this 'upaBial' in the given 'year'
    const logsQuery = logsRef.where('year', '==', year).where('upaBial', '==', upaBial);
    const logsSnapshot = await logsQuery.get();

    const familyIdsInBialForYear = new Set<string>();
    const aggregatedTithes: { [familyId: string]: Tithe } = {};

    logsSnapshot.forEach(doc => {
        const { familyId, tithe } = doc.data();
        familyIdsInBialForYear.add(familyId);
        if (!aggregatedTithes[familyId]) {
            aggregatedTithes[familyId] = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
        }
        aggregatedTithes[familyId].pathianRam += tithe.pathianRam;
        aggregatedTithes[familyId].ramthar += tithe.ramthar;
        aggregatedTithes[familyId].tualchhung += tithe.tualchhung;
    });

    // 2. If it's the current year, also include families whose currentBial matches, even if they haven't contributed yet
    if (year === currentYear) {
        const currentBialFamiliesQuery = familiesRef.where('currentBial', '==', upaBial);
        const currentBialFamiliesSnapshot = await currentBialFamiliesQuery.get();
        currentBialFamiliesSnapshot.forEach(doc => {
            const family = { id: doc.id, ...doc.data() } as Family;
            // Add to the set only if not already present from tithe logs
            if (!familyIdsInBialForYear.has(family.id)) {
                familyIdsInBialForYear.add(family.id);
            }
        });
    }

    const uniqueFamilyIds = Array.from(familyIdsInBialForYear);

    if (uniqueFamilyIds.length === 0) {
        return [];
    }

    // 3. Fetch full family documents for all identified family IDs
    const familiesDocs: Family[] = [];
    // Chunk `in` queries if there are more than 10 unique family IDs
    const chunks: string[][] = [];
    for (let i = 0; i < uniqueFamilyIds.length; i += 10) {
        chunks.push(uniqueFamilyIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
        const chunkSnapshot = await familiesRef.where(firebase.firestore.FieldPath.documentId(), 'in', chunk).get();
        chunkSnapshot.forEach(doc => {
            familiesDocs.push({ id: doc.id, ...doc.data() } as Family);
        });
    }

    // 4. Combine family info with aggregated tithes
    const reportData = familiesDocs.map(family => {
        const totalTithe = aggregatedTithes[family.id] || { pathianRam: 0, ramthar: 0, tualchhung: 0 };
        return {
            id: family.id,
            name: family.name,
            ipSerialNo: family.ipSerialNo,
            tithe: totalTithe
        };
    });
    
    // Sort by S/N
    return reportData.sort((a, b) => (a.ipSerialNo ?? Infinity) - (b.ipSerialNo ?? Infinity));
};


// --- BIAL MANAGEMENT API (YEAR-SPECIFIC) ---

const convertToNewBialInfo = (docData: any): BialInfo => {
    if (docData && Array.isArray(docData.vawngtu)) {
        return docData as BialInfo;
    }
    // Default to an empty array for new or malformed documents
    return { vawngtu: [] };
};

export const updateBialInfo = async (year: number, upaBial: string, data: BialInfo): Promise<void> => {
    const bialRef = db.collection('settings').doc(String(year)).collection('bialInfo').doc(upaBial);
    await bialRef.set({ ...data, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() });
};

export const fetchAllBialInfo = async (year: number): Promise<Map<string, BialInfo>> => {
    const infoMap = new Map<string, BialInfo>(); // Fix: Declare infoMap
    const snapshot = await db.collection('settings').doc(String(year)).collection('bialInfo').get();
    snapshot.forEach(doc => {
        infoMap.set(doc.id, convertToNewBialInfo(doc.data()));
    });
    return infoMap;
};

export const fetchBialInfo = async (year: number, upaBial: string): Promise<BialInfo | null> => {
    const docRef = db.collection('settings').doc(String(year)).collection('bialInfo').doc(upaBial);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return convertToNewBialInfo(docSnap.data());
    }
    return null;
};

export const deleteBialInfo = async (year: number, upaBial: string): Promise<void> => {
    const bialRef = db.collection('settings').doc(String(year)).collection('bialInfo').doc(upaBial);
    await bialRef.delete();
};
