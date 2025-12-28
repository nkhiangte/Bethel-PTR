// Fix: import firebase compat for types and serverTimestamp
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db } from './firebase.ts';
import type { Family, Tithe, TitheCategory, AggregateReportData, FamilyYearlyTitheData, YearlyFamilyTotal, FamilyWithTithe, UserDoc, BialInfo } from './types.ts';

// Fix: Use firebase.User for FirebaseUser type
type FirebaseUser = firebase.User;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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


// --- TITHE & FAMILY API ---

const getTitheLogRef = (year: number, month: string, familyId: string) => {
    const logId = `${year}_${month}_${familyId}`;
    // Fix: Use v8 compat syntax
    return db.collection('titheLogs').doc(logId);
};

export const fetchFamilies = async (year: number, month: string, upaBial: string): Promise<FamilyWithTithe[]> => {
    // Fix: Use v8 compat syntax
    const familiesQuery = db.collection('families').where('currentBial', '==', upaBial);
    const familiesSnapshot = await familiesQuery.get();

    const familiesData: Family[] = familiesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Family));

    const familiesWithTithe: FamilyWithTithe[] = [];

    for (const family of familiesData) {
        const titheLogRef = getTitheLogRef(year, month, family.id);
        // Fix: Use v8 compat get()
        const titheDoc = await titheLogRef.get();
        
        let tithe: Tithe = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
        if (titheDoc.exists) {
            tithe = titheDoc.data()!.tithe as Tithe;
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

    let updatedCount = 0;
    let createdCount = 0;
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

export const removeFamily = async (familyId: string): Promise<void> => {
    // Fix: Use v8 compat syntax
    const batch = db.batch();
    
    // Delete the family document
    const familyRef = db.collection('families').doc(familyId);
    batch.delete(familyRef);
    
    // Find and delete all associated tithe logs
    const logsQuery = db.collection('titheLogs').where('familyId', '==', familyId);
    const logsSnapshot = await logsQuery.get();
    logsSnapshot.forEach(logDoc => {
        batch.delete(logDoc.ref);
    });

    await batch.commit();
};

export const transferFamily = async (familyId: string, destinationUpaBial: string): Promise<void> => {
    // Fix: Use v8 compat syntax
    const batch = db.batch();

    // Update the family's currentBial
    const familyRef = db.collection('families').doc(familyId);
    batch.update(familyRef, { currentBial: destinationUpaBial });
    
    // Find and update all associated tithe logs
    const logsQuery = db.collection('titheLogs').where('familyId', '==', familyId);
    const logsSnapshot = await logsQuery.get();
    logsSnapshot.forEach(logDoc => {
        batch.update(logDoc.ref, { upaBial: destinationUpaBial });
    });

    await batch.commit();
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
    // 1. Fetch all families for the Upa Bial
    // Fix: Use v8 compat syntax
    const familiesQuery = db.collection('families').where('currentBial', '==', upaBial);
    const familiesSnapshot = await familiesQuery.get();
    const families = familiesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Family));

    // 2. Aggregate tithes for the whole year for this bial
    const aggregatedTithes: { [familyId: string]: Tithe } = {};
    // Fix: Use v8 compat syntax
    const logsQuery = db.collection('titheLogs').where('year', '==', year).where('upaBial', '==', upaBial);
    const logsSnapshot = await logsQuery.get();

    logsSnapshot.forEach(doc => {
        const { familyId, tithe } = doc.data();
        if (!aggregatedTithes[familyId]) {
            aggregatedTithes[familyId] = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
        }
        aggregatedTithes[familyId].pathianRam += tithe.pathianRam;
        aggregatedTithes[familyId].ramthar += tithe.ramthar;
        aggregatedTithes[familyId].tualchhung += tithe.tualchhung;
    });

    // 3. Combine family info with aggregated tithes
    const reportData = families.map(family => {
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


// --- BIAL MANAGEMENT API ---

const convertToNewBialInfo = (docData: any): BialInfo => {
    // Handle legacy single overseer format
    if (docData && docData.overseerName !== undefined) {
        return {
            vawngtu: [{
                name: docData.overseerName,
                phone: docData.overseerPhone || ''
            }]
        };
    }
    // Handle documents that have the new field but it might not be an array
    if (docData && Array.isArray(docData.vawngtu)) {
        return docData as BialInfo;
    }
    // Default to an empty array for new or malformed documents
    return { vawngtu: [] };
};

export const updateBialInfo = async (upaBial: string, data: BialInfo): Promise<void> => {
    const bialRef = db.collection('bialInfo').doc(upaBial);
    // Overwrite the document with the new structure. This also handles removing old fields.
    await bialRef.set({ ...data, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() });
};

export const fetchAllBialInfo = async (): Promise<Map<string, BialInfo>> => {
    const infoMap = new Map<string, BialInfo>();
    const snapshot = await db.collection('bialInfo').get();
    snapshot.forEach(doc => {
        infoMap.set(doc.id, convertToNewBialInfo(doc.data()));
    });
    return infoMap;
};

export const fetchBialInfo = async (upaBial: string): Promise<BialInfo | null> => {
    const docRef = db.collection('bialInfo').doc(upaBial);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return convertToNewBialInfo(docSnap.data());
    }
    return null;
};
