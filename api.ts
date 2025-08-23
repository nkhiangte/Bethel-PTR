import { db, auth, firebaseConfig } from './firebase.ts';
import { 
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
    query, where, writeBatch, addDoc, serverTimestamp, orderBy, limit
} from 'firebase/firestore';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    sendPasswordResetEmail
} from 'firebase/auth';

import type { Family, Tithe, AggregateReportData, BialTotal, FamilyYearlyTitheData, YearlyFamilyTotal, FamilyWithTithe } from './types.ts';

// --- CONFIGURATION ---
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const UPA_BIALS = Array.from({ length: 13 }, (_, i) => `Upa Bial ${i + 1}`);

// Check if the firebase config is still the placeholder
export const isFirebaseConfigPlaceholder = (): boolean => {
    return firebaseConfig.apiKey === "YOUR_API_KEY";
}


// --- DATA API ---

export const fetchFamilies = async (year: number, month: string, upaBial: string): Promise<FamilyWithTithe[]> => {
    // 1. Get all tithe logs for the specific year, month, and bial
    const tithesCollection = collection(db, 'tithes');
    const q = query(tithesCollection, 
        where('year', '==', year), 
        where('month', '==', month),
        where('upaBial', '==', upaBial)
    );
    const titheSnap = await getDocs(q);
    const titheLogs = titheSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (titheLogs.length === 0) return [];
    
    // 2. Get the family details for each of those logs
    const familyIds = titheLogs.map(log => log.familyId);
    const familiesCollection = collection(db, 'families');
    const familyQuery = query(familiesCollection, where('__name__', 'in', familyIds));
    const familySnap = await getDocs(familyQuery);

    const familiesMap = new Map<string, Family>();
    familySnap.forEach(doc => familiesMap.set(doc.id, { id: doc.id, ...doc.data() } as Family));

    // 3. Combine them into the FamilyWithTithe structure
    const familiesWithTithe = titheLogs.map(log => {
        const family = familiesMap.get(log.familyId);
        if (!family) return null;
        
        return {
            id: family.id,
            name: family.name,
            ipSerialNo: family.ipSerialNo,
            tithe: log.tithe as Tithe,
        };
    }).filter((f): f is FamilyWithTithe => f !== null)
      .sort((a, b) => (a.ipSerialNo ?? Infinity) - (b.ipSerialNo ?? Infinity)); // Sort by serial number

    return familiesWithTithe;
};

export const addFamily = async (year: number, upaBial: string, name: string): Promise<void> => {
    const trimmedName = name.trim();
    const familiesRef = collection(db, 'families');

    // Check if a family with the same name already exists in this bial
    const existingQuery = query(familiesRef, where('name', '==', trimmedName), where('currentBial', '==', upaBial), limit(1));
    const existingSnap = await getDocs(existingQuery);
    if (!existingSnap.empty) {
        throw new Error(`Family "${trimmedName}" already exists in ${upaBial}.`);
    }

    const batch = writeBatch(db);

    // 1. Create the main family document
    const familyDocRef = doc(familiesRef); // Auto-generate ID
    batch.set(familyDocRef, {
        name: trimmedName,
        ipSerialNo: null,
        currentBial: upaBial,
        createdAt: serverTimestamp(),
    });

    // 2. Create 12 tithe log documents for the specified year
    const tithesRef = collection(db, 'tithes');
    const defaultTithe: Tithe = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
    MONTHS.forEach(month => {
        const titheDocRef = doc(tithesRef); // Auto-generate ID
        batch.set(titheDocRef, {
            year,
            month,
            upaBial,
            familyId: familyDocRef.id,
            tithe: defaultTithe
        });
    });

    await batch.commit();
};


export const importFamilies = async (year: number, upaBial: string, names: string[]): Promise<{added: number, skipped: number}> => {
    const familiesRef = collection(db, 'families');
    
    // Fetch all existing family names in the target bial to check for duplicates
    const existingQuery = query(familiesRef, where('currentBial', '==', upaBial));
    const existingSnap = await getDocs(existingQuery);
    const existingNames = new Set(existingSnap.docs.map(doc => doc.data().name.trim().toLowerCase()));

    const uniqueNamesToImport = [...new Set(names.map(name => name.trim()).filter(Boolean))];

    const familiesToCreate: string[] = [];
    let skippedCount = 0;

    uniqueNamesToImport.forEach(name => {
        if (existingNames.has(name.toLowerCase())) {
            skippedCount++;
        } else {
            familiesToCreate.push(name);
            existingNames.add(name.toLowerCase()); // Avoid duplicates within the import list itself
        }
    });

    if (familiesToCreate.length === 0) {
        return { added: 0, skipped: uniqueNamesToImport.length };
    }

    const batch = writeBatch(db);
    const tithesRef = collection(db, 'tithes');
    const defaultTithe: Tithe = { pathianRam: 0, ramthar: 0, tualchhung: 0 };

    familiesToCreate.forEach(name => {
        // Create family doc
        const familyDocRef = doc(familiesRef);
        batch.set(familyDocRef, {
            name,
            ipSerialNo: null,
            currentBial: upaBial,
            createdAt: serverTimestamp(),
        });

        // Create 12 tithe docs
        MONTHS.forEach(month => {
            const titheDocRef = doc(tithesRef);
            batch.set(titheDocRef, { year, month, upaBial, familyId: familyDocRef.id, tithe: defaultTithe });
        });
    });

    await batch.commit();
    return { added: familiesToCreate.length, skipped: skippedCount };
};

export const updateFamily = async (year: number, month: string, upaBial: string, familyId: string, updatedData: Partial<Family & {tithe: Tithe}>): Promise<void> => {
    // If name or serial number is updated, update the main family document
    if ('name' in updatedData || 'ipSerialNo' in updatedData) {
        const familyDocRef = doc(db, 'families', familyId);
        const dataToUpdate: Partial<Family> = {};
        if ('name' in updatedData) {
             const newName = updatedData.name!.trim();
             // Check for duplicates before updating name
             const q = query(collection(db, 'families'), where('name', '==', newName), where('currentBial', '==', upaBial));
             const snap = await getDocs(q);
             if (!snap.empty && snap.docs[0].id !== familyId) {
                throw new Error(`Another family with the name "${newName}" already exists.`);
             }
             dataToUpdate.name = newName;
        }
        if ('ipSerialNo' in updatedData) {
            dataToUpdate.ipSerialNo = updatedData.ipSerialNo!;
        }
        await updateDoc(familyDocRef, dataToUpdate);
    }

    // If tithe data is updated, update the specific tithe log document
    if ('tithe' in updatedData) {
        const tithesRef = collection(db, 'tithes');
        const q = query(tithesRef, 
            where('year', '==', year), 
            where('month', '==', month), 
            where('familyId', '==', familyId),
            limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
            throw new Error("Could not find tithe record to update.");
        }
        const titheDocRef = snap.docs[0].ref;
        await updateDoc(titheDocRef, { tithe: updatedData.tithe });
    }
};

export const removeFamily = async (familyId: string): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Delete the main family document
    const familyDocRef = doc(db, 'families', familyId);
    batch.delete(familyDocRef);

    // 2. Find and delete all associated tithe logs
    const tithesRef = collection(db, 'tithes');
    const q = query(tithesRef, where('familyId', '==', familyId));
    const titheSnap = await getDocs(q);
    titheSnap.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
};


export const transferFamily = async (familyId: string, destinationUpaBial: string): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Update the family's `currentBial`
    const familyDocRef = doc(db, 'families', familyId);
    batch.update(familyDocRef, { currentBial: destinationUpaBial });

    // 2. Find and update all associated tithe logs
    const tithesRef = collection(db, 'tithes');
    const q = query(tithesRef, where('familyId', '==', familyId));
    const titheSnap = await getDocs(q);
    titheSnap.forEach(doc => {
        batch.update(doc.ref, { upaBial: destinationUpaBial });
    });
    
    await batch.commit();
};


// --- REPORTING API ---
export const fetchMonthlyReport = async (year: number, month: string): Promise<AggregateReportData> => {
    const report: AggregateReportData = {};
    const q = query(collection(db, 'tithes'), where('year', '==', year), where('month', '==', month));
    const snap = await getDocs(q);

    snap.forEach(doc => {
        const log = doc.data();
        const upaBial = log.upaBial;
        const tithe: Tithe = log.tithe;

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
    const q = query(collection(db, 'tithes'), where('year', '==', year));
    const snap = await getDocs(q);

    snap.forEach(doc => {
        const log = doc.data();
        const upaBial = log.upaBial;
        const tithe: Tithe = log.tithe;

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
    const familyDocRef = doc(db, "families", familyId);
    const familySnap = await getDoc(familyDocRef);
    if (!familySnap.exists()) {
        throw new Error("Family not found.");
    }
    const familyData = familySnap.data();
    const familyInfo = {
        name: familyData.name,
        ipSerialNo: familyData.ipSerialNo,
        upaBial: familyData.currentBial
    };

    const yearlyData: FamilyYearlyTitheData = {};
    MONTHS.forEach(month => {
        yearlyData[month] = { pathianRam: 0, ramthar: 0, tualchhung: 0 };
    });

    const q = query(collection(db, 'tithes'), where('year', '==', year), where('familyId', '==', familyId));
    const snap = await getDocs(q);

    snap.forEach(doc => {
        const log = doc.data();
        yearlyData[log.month] = log.tithe;
    });

    return { data: yearlyData, familyInfo };
};


export const fetchBialYearlyFamilyData = async (year: number, upaBial: string): Promise<YearlyFamilyTotal[]> => {
    // 1. Get all families in the specified bial
    const familiesQuery = query(collection(db, 'families'), where('currentBial', '==', upaBial));
    const familiesSnap = await getDocs(familiesQuery);
    if (familiesSnap.empty) return [];

    const familyTotals = new Map<string, YearlyFamilyTotal>();
    familiesSnap.forEach(doc => {
        const data = doc.data();
        familyTotals.set(doc.id, {
            id: doc.id,
            name: data.name,
            ipSerialNo: data.ipSerialNo,
            tithe: { pathianRam: 0, ramthar: 0, tualchhung: 0 },
        });
    });

    // 2. Get all tithe logs for those families for the year
    const familyIds = Array.from(familyTotals.keys());
    const tithesQuery = query(collection(db, 'tithes'), where('year', '==', year), where('familyId', 'in', familyIds));
    const tithesSnap = await getDocs(tithesQuery);

    // 3. Aggregate the totals
    tithesSnap.forEach(doc => {
        const log = doc.data();
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

export const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const register = async (email: string, password: string, name: string, assignedBial: string | null = null) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create a user profile document in Firestore
    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: user.email,
        assignedBial: assignedBial
    });

    return userCredential;
};

export const requestPasswordReset = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
};

export const getAssignedBial = async (uid: string): Promise<string | null> => {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return docSnap.data().assignedBial || null;
    }
    return null;
};

export const logout = () => {
    return signOut(auth);
};