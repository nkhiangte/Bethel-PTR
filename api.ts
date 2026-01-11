
// Fix: import firebase compat for types and serverTimestamp
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
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

    const snapshot = await db.collection('settings').get();

    let bialsToSeed: string[];
    if (snapshot.empty) {
        bialsToSeed = SEED_UPA_BIALS;
    } else {
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
            bialsToSeed = SEED_UPA_BIALS;
        }
    }
    
    await yearDocRef.set({ list: bialsToSeed });
    return bialsToSeed.sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
};

export const updateUpaBialsList = async (year: number, newList: string[]): Promise<void> => {
    const yearDocRef = db.collection('settings').doc(String(year));
    await yearDocRef.set({ list: newList });
};

export const isBialInUse = async (year: number, bialName: string): Promise<boolean> => {
    const logsQuery = db.collection('titheLogs')
                        .where('year', '==', year)
                        .where('upaBial', '==', bialName)
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
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        const isAdmin = user.email === 'nkhiangte@gmail.com';
        await userRef.set({
            uid: user.uid,
            email: user.email,
            displayName: additionalData?.displayName || user.displayName || user.email?.split('@')[0],
            isAdmin: isAdmin,
            assignedBial: isAdmin ? null : (additionalData?.assignedBial || null),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    }
};

export const fetchAllUsers = async (): Promise<UserDoc[]> => {
    const usersQuery = db.collection('users').orderBy('email');
    const snapshot = await usersQuery.get();
    return snapshot.docs.map(d => d.data() as UserDoc);
};

export const updateUserRoles = async (uid: string, roles: { isAdmin: boolean; assignedBial: string | null }): Promise<void> => {
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
        isAdmin: roles.isAdmin,
        assignedBial: roles.assignedBial,
    });
};

export const fetchUserDocument = async (uid: string): Promise<UserDoc | null> => {
    const userRef = db.collection('users').doc(uid);
    const docSnap = await userRef.get();
    if (docSnap.exists) {
        return docSnap.data() as UserDoc;
    }
    return null;
};

export const deleteUserDocument = async (uid: string): Promise<void> => {
    await db.collection('users').doc(uid).delete();
};


// --- TITHE & FAMILY API ---

const getTitheLogRef = (year: number, month: string, familyId: string) => {
    const logId = `${year}_${month}_${familyId}`;
    return db.collection('titheLogs').doc(logId);
};

export const fetchFamilies = async (year: number, month: string, upaBial: string): Promise<FamilyWithTithe[]> => {
    const familiesRef = db.collection('families');
    const titheLogsRef = db.collection('titheLogs');
    const currentYear = new Date().getFullYear();

    const familyIdsInBial = new Set<string>();
    const titheDataMap = new Map<string, Tithe>();

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

    // 2. If it's the current year, also include families currently assigned to this upaBial
    if (year === currentYear) {
        const currentBialFamiliesQuery = familiesRef.where('currentBial', '==', upaBial);
        const currentBialFamiliesSnapshot = await currentBialFamiliesQuery.get();
        currentBialFamiliesSnapshot.forEach(doc => {
            const family = { id: doc.id, ...doc.data() } as Family;
            if (!familyIdsInBial.has(family.id)) {
                familyIdsInBial.add(family.id);
            }
        });
    }

    const uniqueFamilyIds = Array.from(familyIdsInBial);

    if (uniqueFamilyIds.length === 0) {
        return [];
    }

    // 3. Fetch full family documents
    const familiesDocs: Family[] = [];
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

    // 4. Combine family data
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

export const fetchFamilyById = async (familyId: string): Promise<Family | null> => {
    const docRef = db.collection('families').doc(familyId);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as Family;
    }
    return null;
};


export const addFamily = async (year: number, month: string, upaBial: string, name: string): Promise<void> => {
    const trimmedName = name.trim();
    // Check globally unassigned families first to reuse
    const unassignedQuery = db.collection('families').where('name', '==', trimmedName).where('currentBial', '==', null);
    const unassignedSnap = await unassignedQuery.get();
    
    if (!unassignedSnap.empty) {
         // Reuse existing unassigned family
         const doc = unassignedSnap.docs[0];
         await doc.ref.update({ currentBial: upaBial });
         // Create initial log
         const logRef = getTitheLogRef(year, month, doc.id);
         await logRef.set({
            year,
            month,
            familyId: doc.id,
            upaBial,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 },
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
         });
         return;
    }

    const q = db.collection('families').where('name', '==', trimmedName).where('currentBial', '==', upaBial);
    const existing = await q.get();

    if (!existing.empty) {
        throw new Error(`Family "${trimmedName}" already exists in ${upaBial}.`);
    }

    const batch = db.batch();
    const newFamilyRef = db.collection('families').doc();
    
    // 1. Create the family document
    batch.set(newFamilyRef, {
        name: trimmedName,
        currentBial: upaBial,
        ipSerialNo: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // 2. Create an initial 0-value tithe log for the specific year/month.
    const logRef = getTitheLogRef(year, month, newFamilyRef.id);
    batch.set(logRef, {
        year,
        month,
        familyId: newFamilyRef.id,
        upaBial,
        tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 },
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
};

export const importFamilies = async (year: number, upaBial: string, familiesToImport: { name: string; ipSerialNo: number | null }[]): Promise<{added: number, skipped: number, reactivated: number}> => {
    const batch = db.batch();
    const familiesRef = db.collection('families');
    
    // 1. Fetch assigned families in this Bial to avoid duplicates
    const assignedSnap = await familiesRef.where('currentBial', '==', upaBial).get();
    const assignedMap = new Set(assignedSnap.docs.map(d => d.data().name.trim().toLowerCase()));

    // 2. Fetch ALL unassigned families to reuse them if names match
    const unassignedSnap = await familiesRef.where('currentBial', '==', null).get();
    const unassignedMap = new Map<string, firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>>();
    unassignedSnap.forEach(doc => {
        unassignedMap.set(doc.data().name.trim().toLowerCase(), doc);
    });
    
    // Deduplicate import list
    const uniqueFamiliesFromFile = new Map<string, { name: string; ipSerialNo: number | null }>();
    for (const family of familiesToImport) {
        const trimmedName = family.name.trim();
        if (trimmedName && !uniqueFamiliesFromFile.has(trimmedName.toLowerCase())) {
            uniqueFamiliesFromFile.set(trimmedName.toLowerCase(), family);
        }
    }
    
    let addedCount = 0;
    let skippedCount = 0;
    let reactivatedCount = 0;

    for (const family of uniqueFamiliesFromFile.values()) {
        const nameKey = family.name.trim().toLowerCase();
        
        if (assignedMap.has(nameKey)) {
            skippedCount++;
        } else if (unassignedMap.has(nameKey)) {
            // Reactivate existing unassigned family
            const doc = unassignedMap.get(nameKey)!;
            batch.update(doc.ref, {
                currentBial: upaBial,
                ipSerialNo: family.ipSerialNo,
            });
            reactivatedCount++;
            // Remove from map to handle duplicates within the logic if needed (though uniqueFamiliesFromFile handles file dups)
            unassignedMap.delete(nameKey);
        } else {
            // Create new
            const newFamilyRef = familiesRef.doc();
            batch.set(newFamilyRef, {
                name: family.name.trim(),
                currentBial: upaBial,
                ipSerialNo: family.ipSerialNo, 
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            addedCount++;
        }
    }

    if (addedCount > 0 || reactivatedCount > 0) {
        await batch.commit();
    }
    
    return { added: addedCount, skipped: skippedCount, reactivated: reactivatedCount };
};

export const importContributions = async (
    year: number,
    month: string,
    upaBial: string,
    contributionsToImport: { name: string; ipSerialNo: number | null; tithe: Tithe }[]
): Promise<{ updated: number; created: number; skipped: number; skippedInfo: { name: string, reason: string }[] }> => {
    const batch = db.batch();

    const familiesQuery = db.collection('families').where('currentBial', '==', upaBial);
    const familiesSnapshot = await familiesQuery.get();
    
    const familiesByName = new Map<string, Family>();
    const familiesBySerial = new Map<number, Family>();
    familiesSnapshot.docs.forEach(d => {
        const family = { id: d.id, ...d.data() } as Family;
        familiesByName.set(family.name.trim().toLowerCase(), family);
        if (family.ipSerialNo !== null && family.ipSerialNo !== undefined) {
            familiesBySerial.set(family.ipSerialNo, family);
        }
    });

    // Check unassigned families for reuse if not found in current bial
    const unassignedQuery = db.collection('families').where('currentBial', '==', null);
    const unassignedSnap = await unassignedQuery.get();
    const unassignedByName = new Map<string, Family>();
    unassignedSnap.docs.forEach(d => {
         const family = { id: d.id, ...d.data() } as Family;
         unassignedByName.set(family.name.trim().toLowerCase(), family);
    });

    let updatedCount = 0;    let createdCount = 0;
    const skippedRecords: { name: string, reason: string }[] = [];
    const processedNames = new Set<string>();

    for (const record of contributionsToImport) {
        const trimmedName = record.name.trim();
        const nameKey = trimmedName.toLowerCase();
        
        if (!trimmedName || processedNames.has(nameKey)) {
             if (trimmedName && processedNames.has(nameKey)) {
                skippedRecords.push({ name: trimmedName, reason: "Duplicate entry in the import file." });
            }
            continue;
        }
        processedNames.add(nameKey);

        let familyToUpdate: Family | undefined = undefined;

        if (record.ipSerialNo !== null && record.ipSerialNo !== undefined) {
            familyToUpdate = familiesBySerial.get(record.ipSerialNo);
        }
        if (!familyToUpdate) {
            familyToUpdate = familiesByName.get(nameKey);
        }

        if (familyToUpdate) {
            const logRef = getTitheLogRef(year, month, familyToUpdate.id);
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
            // Check if unassigned exists to reuse
            const unassignedFamily = unassignedByName.get(nameKey);
            
            let targetFamilyId: string;
            
            if (unassignedFamily) {
                // Reuse unassigned
                targetFamilyId = unassignedFamily.id;
                batch.update(db.collection('families').doc(targetFamilyId), {
                    currentBial: upaBial,
                    ipSerialNo: record.ipSerialNo // Update serial if provided
                });
                // Remove from map to prevent double usage
                unassignedByName.delete(nameKey);
            } else {
                // Create new
                const newFamilyRef = db.collection('families').doc();
                targetFamilyId = newFamilyRef.id;
                batch.set(newFamilyRef, {
                    name: trimmedName,
                    currentBial: upaBial,
                    ipSerialNo: record.ipSerialNo,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }

            const logRef = getTitheLogRef(year, month, targetFamilyId);
            batch.set(logRef, {
                year,
                month,
                familyId: targetFamilyId,
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
    const familyRef = db.collection('families').doc(familyId);
    await familyRef.update(data);
};

export const removeFamily = async (familyId: string, year: number): Promise<void> => {
    const batch = db.batch();
    const currentYearNum = new Date().getFullYear();
    
    // 1. Delete all tithe logs for this specific year for this family
    const logsQuery = db.collection('titheLogs').where('familyId', '==', familyId).where('year', '==', year);
    const logsSnapshot = await logsQuery.get();
    logsSnapshot.forEach(logDoc => {
        batch.delete(logDoc.ref);
    });

    // 2. IMPORTANT: If this is the current year, also unassign the family from their current Bial 
    // so they disappear from the active data entry list.
    if (year === currentYearNum) {
        batch.update(db.collection('families').doc(familyId), { currentBial: null });
    }

    await batch.commit();
};

export const bulkRemoveFamilies = async (familyIds: string[], year: number): Promise<void> => {
    const currentYearNum = new Date().getFullYear();
    const chunkSize = 50; 
    
    for (let i = 0; i < familyIds.length; i += chunkSize) {
        const chunk = familyIds.slice(i, i + chunkSize);
        const batch = db.batch();
        
        // Fetch all logs for this year for all families in the chunk
        const logsSnapshot = await db.collection('titheLogs')
            .where('year', '==', year)
            .where('familyId', 'in', chunk)
            .get();
            
        logsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // If current year, also unassign from Bial
        if (year === currentYearNum) {
            chunk.forEach(id => {
                batch.update(db.collection('families').doc(id), { currentBial: null });
            });
        }
        
        await batch.commit();
    }
};

export const removeAllFamiliesFromBial = async (year: number, bialName: string): Promise<void> => {
    // IMPORTANT: Only delete tithe logs to preserve independence between years.
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
    const familyRef = db.collection('families').doc(familyId);
    await familyRef.update({ currentBial: destinationUpaBial });
};

export const unassignFamilyFromBial = async (familyId: string): Promise<void> => {
    const familyRef = db.collection('families').doc(familyId);
    await familyRef.update({ currentBial: null });
};

export const searchAllFamilies = async (searchTerm: string = ''): Promise<Family[]> => {
    const familiesRef = db.collection('families');
    const snapshot = await familiesRef.orderBy('name').get();

    let results: Family[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Family));

    const filterTerm = searchTerm.trim().toLowerCase();
    if (filterTerm !== '') {
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

    if (year === currentYear) {
        const currentBialFamiliesQuery = familiesRef.where('currentBial', '==', upaBial);
        const currentBialFamiliesSnapshot = await currentBialFamiliesQuery.get();
        currentBialFamiliesSnapshot.forEach(doc => {
            const family = { id: doc.id, ...doc.data() } as Family;
            if (!familyIdsInBialForYear.has(family.id)) {
                familyIdsInBialForYear.add(family.id);
            }
        });
    }

    const uniqueFamilyIds = Array.from(familyIdsInBialForYear);

    if (uniqueFamilyIds.length === 0) {
        return [];
    }

    const familiesDocs: Family[] = [];
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

    const reportData = familiesDocs.map(family => {
        const totalTithe = aggregatedTithes[family.id] || { pathianRam: 0, ramthar: 0, tualchhung: 0 };
        return {
            id: family.id,
            name: family.name,
            ipSerialNo: family.ipSerialNo,
            tithe: totalTithe
        };
    });
    
    return reportData.sort((a, b) => (a.ipSerialNo ?? Infinity) - (b.ipSerialNo ?? Infinity));
};


// --- BIAL MANAGEMENT API (YEAR-SPECIFIC) ---

const convertToNewBialInfo = (docData: any): BialInfo => {
    if (docData && Array.isArray(docData.vawngtu)) {
        return docData as BialInfo;
    }
    return { vawngtu: [] };
};

export const updateBialInfo = async (year: number, upaBial: string, data: BialInfo): Promise<void> => {
    const bialRef = db.collection('settings').doc(String(year)).collection('bialInfo').doc(upaBial);
    await bialRef.set({ ...data, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() });
};

export const fetchAllBialInfo = async (year: number): Promise<Map<string, BialInfo>> => {
    const infoMap = new Map<string, BialInfo>(); 
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
