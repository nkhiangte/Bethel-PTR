import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const FIREBASE_CONFIG_KEY = 'firebaseConfig';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;

const saveFirebaseConfig = (config: FirebaseOptions) => {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
};

const getFirebaseConfig = (): FirebaseOptions | null => {
    const configStr = localStorage.getItem(FIREBASE_CONFIG_KEY);
    return configStr ? JSON.parse(configStr) : null;
};

const clearFirebaseConfig = () => {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
};

const isFirebaseConfigured = (): boolean => {
    return !!getFirebaseConfig();
};

const initializeFirebase = () => {
    const firebaseConfig = getFirebaseConfig();
    if (!firebaseConfig) {
        throw new Error("Firebase configuration not found in local storage.");
    }
    
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
};

export { 
    auth, 
    db,
    googleProvider,
    initializeFirebase, 
    isFirebaseConfigured, 
    saveFirebaseConfig,
    getFirebaseConfig,
    clearFirebaseConfig
};